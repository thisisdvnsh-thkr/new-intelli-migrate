from agents.normalizer import Normalizer

records = [
    {
        'full_name': 'John',
        'email': 'john@test.com',
        'unit_price': 99.5,
        'order_date': '2024-01-15'
    }
]

norm = Normalizer()
try:
    res = norm.normalize(records, table_name='orders')
    print('Normalization succeeded')
    print('Tables:', [t.name for t in res.tables])
    for t in res.tables:
        print('Table', t.name)
        for c in t.columns:
            print('  Col:', c.name, c.data_type, 'PK' if c.primary_key else '')
        print('  Records:', t.records)
    print('\nERD:\n', res.erd_diagram)
except Exception as e:
    import traceback
    print('Normalization failed:', e)
    traceback.print_exc()
