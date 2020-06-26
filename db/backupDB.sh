date_string=$(date +'%m%d%Y')
/Applications/Postgres.app/Contents/Versions/11/bin/pg_dump --file=$PWD$"/creaver_backup_${date_string}.sql" --username=sallar  creaver_db