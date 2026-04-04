import traceback

try:
    import tmp_create_prod_admin
    tmp_create_prod_admin.main()
except Exception as e:
    with open("err.txt", "w", encoding='utf-8') as f:
        traceback.print_exc(file=f)
