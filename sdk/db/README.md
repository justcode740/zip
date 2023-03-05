# dev note

dbdiagram design and change

export to postgresql

clear all tables
```
DO $$ DECLARE
    r RECORD;
BEGIN
    -- if the schema you operate on is not "current", you will want to
    -- replace current_schema() in query with 'schematodeletetablesfrom'
    -- *and* update the generate 'DROP...' accordingly.
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;
```
create new tables in db
```
 \i path/to/<filename>.sql
```
grant permission to user
```
GRANT ALL PRIVILEGES ON DATABASE zipdb TO zw;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO zw;
```
notify prisma the changes
```
npx prisma db pull
npx prisma generate
```
read, and write tables

deploy new schema to heroku

delete previous schema

create new tables in heroku db
```
psql -h host -p port -d dbname -U username -f <filename>.sql
```

change the DATABASE_URL to heroku one, and read and write the db


