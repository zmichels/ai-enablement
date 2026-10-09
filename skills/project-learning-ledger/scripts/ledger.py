#!/usr/bin/env python3
"""Validate a portable ledger or export documents and explicit Decision-PGA slices.

Python 3.10+, standard library only. Reads files; writes JSON/JSONL to stdout.
No embedding, inference, network access, package installation or PGA fitting.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

SCHEMA = Path(__file__).resolve().parents[1] / 'assets/ledger.schema.json'
UPSTREAM = '8dfcd3e76abec20ef4522e9bb74fd1a7290a76fb'
TABLES = ('records', 'relations', 'spaces', 'protocols', 'populations',
          'configurations', 'runs', 'observations', 'measurements')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def shape(value, rule, schema, path='$'):
    """Check the schema keywords used by our bundled, fixed v1 contract."""
    if '$ref' in rule:
        return shape(value, schema['$defs'][rule['$ref'].split('/')[-1]], schema, path)
    predicates = {'null': lambda v: v is None,
                  'object': lambda v: isinstance(v, dict),
                  'array': lambda v: isinstance(v, list),
                  'string': lambda v: isinstance(v, str),
                  'integer': lambda v: type(v) is int,
                  'number': lambda v: type(v) in (int, float) and math.isfinite(v)}
    kinds = rule['type'] if isinstance(rule['type'], list) else [rule['type']]
    require(any(predicates[k](value) for k in kinds), f'{path}: expected {kinds}')
    if 'enum' in rule:
        require(value in rule['enum'], f'{path}: unsupported value')
    if isinstance(value, dict):
        require(set(rule.get('required', [])) <= set(value), f'{path}: missing fields')
        props = rule.get('properties', {})
        extra = rule.get('additionalProperties', True)
        for key, item in value.items():
            require(key in props or extra is not False, f'{path}: unknown field {key}')
            child = props.get(key, extra)
            if isinstance(child, dict):
                shape(item, child, schema, f'{path}.{key}')
    elif isinstance(value, list):
        require(len(value) >= rule.get('minItems', 0), f'{path}: too few items')
        if rule.get('uniqueItems'):
            require(len({json.dumps(v, sort_keys=True) for v in value}) == len(value),
                    f'{path}: duplicate items')
        for index, item in enumerate(value):
            shape(item, rule['items'], schema, f'{path}[{index}]')
    elif isinstance(value, str):
        require(len(value.strip()) >= rule.get('minLength', 0), f'{path}: empty text')
    elif type(value) in (int, float):
        require(rule.get('minimum', -math.inf) <= value <= rule.get('maximum', math.inf),
                f'{path}: outside range')


def acyclic(adjacency, label):
    visiting, done = set(), set()

    def visit(node):
        require(node not in visiting, f'{label}: cycle at {node}')
        if node in done:
            return
        visiting.add(node)
        for parent in adjacency.get(node, []):
            visit(parent)
        visiting.remove(node)
        done.add(node)

    for node in adjacency:
        visit(node)


def validate(data):
    schema = json.loads(SCHEMA.read_text())
    shape(data, schema, schema)
    tables = {}
    for name in TABLES:
        tables[name] = {row['id']: row for row in data[name]}
        require(len(tables[name]) == len(data[name]), f'{name}: duplicate IDs')

    def link(name, key):
        require(key in tables[name], f'Unknown {name} reference: {key}')

    for record in data['records']:
        if record['parent_id'] is not None:
            link('records', record['parent_id'])
        require((record['kind'] == 'metric') == (record['metric'] is not None),
                f"{record['id']}: metric definition must match record kind")
    acyclic({r['id']: [r['parent_id']] if r['parent_id'] else [] for r in data['records']}, 'record hierarchy')
    supersession = {}
    for edge in data['relations']:
        link('records', edge['from']); link('records', edge['to'])
        require(edge['from'] != edge['to'], 'A relation cannot link a record to itself')
        if edge['type'] == 'supersedes':
            supersession.setdefault(edge['from'], []).append(edge['to'])
    acyclic(supersession, 'supersession')
    for space in data['spaces']:
        require(set(space['definitions']) == set(space['labels']), 'Every candidate needs its meaning')
        parent = space['parent']
        if parent is not None:
            link('spaces', parent['space_id'])
            target = tables['spaces'][parent['space_id']]
            require(space['question'] == target['question'], 'Scale mapping changes the question')
            require(set(parent['mapping']) == set(space['labels']), 'Scale mapping must cover every fine label')
            require(set(parent['mapping'].values()) == set(target['labels']), 'Scale mapping must cover every coarse label')
    acyclic({s['id']: [s['parent']['space_id']] if s['parent'] else [] for s in data['spaces']}, 'candidate spaces')
    repeats = set()
    for run in data['runs']:
        link('populations', run['population_id']); link('configurations', run['config_id'])
        key = (run['population_id'], run['config_id'], run['case_id'], run['repeat_index'])
        require(key not in repeats, 'Duplicate case/repeat within a population and configuration')
        repeats.add(key)
        require(run['outcome']['state'] == 'unmeasured' or run['outcome']['source'] is not None,
                'A checked outcome needs a source')
    positions, sequences = set(), set()
    for obs in data['observations']:
        for name, field in [('records', 'record_id'), ('runs', 'run_id'),
                            ('spaces', 'space_id'), ('protocols', 'protocol_id')]:
            link(name, obs[field])
        base = (obs['run_id'], obs['record_id'], obs['space_id'], obs['protocol_id'])
        require(base + (obs['stage'],) not in positions, 'Duplicate observation for a run/stage')
        require(base + (obs['sequence'],) not in sequences, 'Duplicate observation sequence')
        positions.add(base + (obs['stage'],)); sequences.add(base + (obs['sequence'],))
        values = obs['probabilities']
        if values is None:
            require(obs['missing_reason'] is not None, 'Missing vector needs a reason')
        else:
            require(obs['missing_reason'] is None, 'Present vector cannot have a missing reason')
            require(len(values) == len(tables['spaces'][obs['space_id']]['labels']), 'Vector dimension differs from its candidate space')
            require(math.isclose(sum(values), 1.0, rel_tol=0, abs_tol=1e-6), 'Support vector must sum to 1; no silent normalization')
    for measure in data['measurements']:
        link('records', measure['metric_record_id']); link('runs', measure['run_id'])
        require(tables['records'][measure['metric_record_id']]['kind'] == 'metric', 'Measurement needs a metric definition')
        require((measure['value'] is None) == (measure['missing_reason'] is not None), 'Measurement missingness is inconsistent')
    return tables


def project_vector(values, source, target, spaces):
    """Sum an explicitly declared fine partition; never infer label alignment."""
    path = [source]
    while source != target:
        space = spaces[source]
        require(space['parent'] is not None, 'Requested scale is not an ancestor of the source space')
        parent = space['parent']
        labels = spaces[parent['space_id']]['labels']
        aggregated = dict.fromkeys(labels, 0.0)
        for label, value in zip(space['labels'], values):
            aggregated[parent['mapping'][label]] += value
        values = [aggregated[label] for label in labels]
        source = parent['space_id']; path.append(source)
    return values, path


def export_pga(data, *, population, config, record, space, protocol, stages,
               from_space=None, trajectory=False, allow_incomplete=False):
    tables = validate(data)
    source = from_space or space
    for name, key in [('populations', population), ('configurations', config), ('records', record),
                      ('spaces', source), ('spaces', space), ('protocols', protocol)]:
        require(key in tables[name], f'Unknown selection {name}: {key}')
    require(len(stages) >= (2 if trajectory else 1) and len(stages) == len(set(stages)), 'Select distinct ordered stages')
    require(trajectory or len(stages) == 1, 'A cloud uses one stage')
    # Resolve the mapping even if the selection later contains no usable rows.
    _, mapping = project_vector([1 / len(tables['spaces'][source]['labels'])] * len(tables['spaces'][source]['labels']), source, space, tables['spaces'])
    eligible = [r for r in data['runs'] if r['population_id'] == population and r['config_id'] == config]
    selected = {(o['run_id'], o['stage']): o for o in data['observations']
                if o['record_id'] == record and o['space_id'] == source and o['protocol_id'] == protocol}
    included, excluded, rows = [], [], []
    for run in eligible:
        observations = [selected.get((run['id'], stage)) for stage in stages]
        missing = [{'stage': stage, 'reason': o['missing_reason'] if o else 'No observation'}
                   for stage, o in zip(stages, observations) if o is None or o['probabilities'] is None]
        if missing:
            excluded.append({'run_id': run['id'], 'missing': missing})
            continue
        sequence = [o['sequence'] for o in observations]
        require(sequence == sorted(sequence), f"{run['id']}: stage order conflicts with observation sequence")
        vectors = [project_vector(o['probabilities'], source, space, tables['spaces'])[0] for o in observations]
        rows.append(vectors if trajectory else vectors[0])
        included.append({'run_id': run['id'], 'case_id': run['case_id'], 'repeat_index': run['repeat_index'],
                         'observation_ids': [o['id'] for o in observations], 'outcome': run['outcome']})
    require(not excluded or allow_incomplete, 'Incomplete runs; inspect missingness or explicitly use --allow-incomplete')
    require(len(rows) >= 2, 'At least two complete runs are required by this export workflow')
    result = {'source': 'kinematic_trajectory' if trajectory else 'probability_cloud',
              'labels': tables['spaces'][space]['labels'], 'runs' if trajectory else 'probabilities': rows}
    if trajectory:
        result['steps'] = stages
    result['metadata'] = {
        'exporter_version': 1, 'upstream_contract_revision': UPSTREAM, 'project_id': data['project_id'],
        'ledger_canonical_sha256': hashlib.sha256(json.dumps(data, sort_keys=True, allow_nan=False).encode()).hexdigest(),
        'population': tables['populations'][population], 'configuration': tables['configurations'][config],
        'record_id': record, 'protocol': tables['protocols'][protocol], 'stages': stages,
        'space_path': [tables['spaces'][key] for key in mapping],
        'eligible_run_count': len(eligible), 'included_run_count': len(included),
        'distinct_case_count': len({r['case_id'] for r in included}),
        'included': included, 'excluded': excluded,
        'weighting': 'One row per included run at each selected stage; case repeats are not independent cases.',
        'interpretation': 'Support geometry is diagnostic, not correctness, causality or authorization. Compare outcomes separately.'}
    return result


def documents(data):
    validate(data)
    for record in data['records']:
        text = '\n'.join([record['title'], record['text'], record['scope']])
        yield {'id': record['id'], 'text': text,
               'text_sha256': hashlib.sha256(text.encode()).hexdigest(),
               'metadata': {'project_id': data['project_id'], 'schema_version': data['schema_version'], 'record': record,
                            'relations': [e for e in data['relations'] if record['id'] in (e['from'], e['to'])]}}


def read(path):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            require(key not in result, f'Duplicate JSON key: {key}')
            result[key] = value
        return result
    return json.loads(Path(path).read_text(), object_pairs_hook=unique)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    for command in ('validate', 'documents', 'cloud', 'trajectory'):
        p = sub.add_parser(command); p.add_argument('ledger')
        if command in ('cloud', 'trajectory'):
            for key in ('population', 'config', 'record', 'space', 'protocol'):
                p.add_argument('--' + key, required=True)
            p.add_argument('--from-space')
            p.add_argument('--stages', required=True, help='One stage for a cloud; comma-separated ordered stages for a trajectory')
            p.add_argument('--allow-incomplete', action='store_true')
    args = parser.parse_args()
    try:
        data = read(args.ledger)
        if args.command == 'validate':
            validate(data); print(json.dumps({'valid': True, 'records': len(data['records']), 'observations': len(data['observations'])}))
        elif args.command == 'documents':
            for row in documents(data):
                print(json.dumps(row, ensure_ascii=False, allow_nan=False))
        else:
            values = vars(args).copy()
            values.pop('command'); values.pop('ledger')
            values['stages'] = [s.strip() for s in values['stages'].split(',')]
            print(json.dumps(export_pga(data, trajectory=args.command == 'trajectory', **values), indent=2, allow_nan=False))
    except (ValueError, KeyError, TypeError, OSError) as error:
        parser.exit(1, f'{error}\n')


if __name__ == '__main__':
    main()
