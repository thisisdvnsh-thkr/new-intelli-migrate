"""
Agent 5: SQL Generator
Generates DDL/DML SQL scripts and deploys to cloud databases (PostgreSQL).
Supports MySQL, PostgreSQL, SQLite syntax variations.
"""

from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
import json
import re
from datetime import datetime


@dataclass
class SQLScript:
    """Generated SQL script"""
    ddl: str  # CREATE TABLE statements
    dml: str  # INSERT statements
    full_script: str  # Combined DDL + DML
    dialect: str  # 'postgresql', 'mysql', 'sqlite'
    table_count: int
    record_count: int


@dataclass
class DeploymentResult:
    """Result of database deployment"""
    success: bool
    message: str
    tables_created: List[str]
    records_inserted: int
    errors: List[str]
    connection_string: Optional[str] = None


class SQLGenerator:
    """
    Agent 5: SQL Script Generator & Deployer
    
    Capabilities:
    - Generate DDL (CREATE TABLE) with proper data types
    - Generate DML (INSERT) with batch optimization
    - Support multiple dialects (PostgreSQL, MySQL, SQLite)
    - Deploy directly to managed Postgres (Render, Supabase)
    - Handle foreign key constraints
    - Escape special characters and SQL injection prevention
    """
    
    # Type mappings for different SQL dialects
    TYPE_MAPPINGS = {
        'postgresql': {
            'INTEGER': 'INTEGER',
            'FLOAT': 'DOUBLE PRECISION',
            'DECIMAL': 'DECIMAL',
            'VARCHAR': 'VARCHAR',
            'TEXT': 'TEXT',
            'BOOLEAN': 'BOOLEAN',
            'DATE': 'DATE',
            'DATETIME': 'TIMESTAMP',
            'TIMESTAMP': 'TIMESTAMP',
            'JSON': 'JSONB',
            'EMAIL': 'VARCHAR(255)',
        },
        'mysql': {
            'INTEGER': 'INT',
            'FLOAT': 'DOUBLE',
            'DECIMAL': 'DECIMAL',
            'VARCHAR': 'VARCHAR',
            'TEXT': 'TEXT',
            'BOOLEAN': 'TINYINT(1)',
            'DATE': 'DATE',
            'DATETIME': 'DATETIME',
            'TIMESTAMP': 'TIMESTAMP',
            'JSON': 'JSON',
            'EMAIL': 'VARCHAR(255)',
        },
        'sqlite': {
            'INTEGER': 'INTEGER',
            'FLOAT': 'REAL',
            'DECIMAL': 'REAL',
            'VARCHAR': 'TEXT',
            'TEXT': 'TEXT',
            'BOOLEAN': 'INTEGER',
            'DATE': 'TEXT',
            'DATETIME': 'TEXT',
            'TIMESTAMP': 'TEXT',
            'JSON': 'TEXT',
            'EMAIL': 'TEXT',
        }
    }
    
    def __init__(self, dialect: str = 'postgresql'):
        """
        Args:
            dialect: SQL dialect ('postgresql', 'mysql', 'sqlite')
        """
        self.dialect = dialect.lower()
        self.supabase_client = None
    
    def generate_sql(self, tables: List[Dict], relationships: List[Dict] = None) -> SQLScript:
        """
        Generate complete SQL script from normalized tables
        
        Args:
            tables: List of table definitions with columns and records
            relationships: Foreign key relationships
        """
        ddl_statements = []
        dml_statements = []
        total_records = 0
        
        # Generate DROP TABLE statements (in reverse order for FK constraints)
        table_names = [t.get('name', t.get('table_name', 'unnamed')) for t in tables]
        for name in reversed(table_names):
            ddl_statements.append(self._generate_drop_table(name))
        
        ddl_statements.append('')  # Blank line
        
        # Generate CREATE TABLE statements
        for table in tables:
            table_name = table.get('name', table.get('table_name', 'unnamed'))
            columns = table.get('columns', [])
            foreign_keys = table.get('foreign_keys', [])
            
            ddl_statements.append(self._generate_create_table(
                table_name, columns, foreign_keys
            ))
            
            # Generate INSERT statements
            records = table.get('records', [])
            if records:
                dml_statements.extend(self._generate_inserts(table_name, records, columns))
                total_records += len(records)
        
        ddl = '\n\n'.join(ddl_statements)
        dml = '\n'.join(dml_statements)
        
        # Create header
        header = self._generate_header(len(tables), total_records)
        
        full_script = f"{header}\n\n-- DDL: Table Definitions\n{ddl}\n\n-- DML: Data Insertion\n{dml}"
        
        return SQLScript(
            ddl=ddl,
            dml=dml,
            full_script=full_script,
            dialect=self.dialect,
            table_count=len(tables),
            record_count=total_records
        )
    
    def _generate_header(self, table_count: int, record_count: int) -> str:
        """Generate SQL script header"""
        timestamp = datetime.now().isoformat()
        return f"""-- ============================================
-- Intelli-Migrate Generated SQL Script
-- ============================================
-- Generated: {timestamp}
-- Dialect: {self.dialect.upper()}
-- Tables: {table_count}
-- Records: {record_count}
-- ============================================
"""
    
    def _generate_drop_table(self, table_name: str) -> str:
        """Generate DROP TABLE statement"""
        safe_name = self._safe_identifier(table_name)
        
        if self.dialect == 'postgresql':
            return f"DROP TABLE IF EXISTS {safe_name} CASCADE;"
        elif self.dialect == 'mysql':
            return f"DROP TABLE IF EXISTS {safe_name};"
        else:  # sqlite
            return f"DROP TABLE IF EXISTS {safe_name};"
    
    def _generate_create_table(self, table_name: str, columns: List[Dict], 
                                foreign_keys: List[Tuple] = None) -> str:
        """Generate CREATE TABLE statement"""
        safe_name = self._safe_identifier(table_name)
        
        col_definitions = []
        pk_columns = []
        
        for col in columns:
            col_name = self._safe_identifier(col.get('name', 'unnamed'))
            col_type = self._map_type(col.get('data_type', 'TEXT'))
            
            definition = f"    {col_name} {col_type}"
            
            if col.get('primary_key'):
                pk_columns.append(col_name)
                if self.dialect == 'sqlite':
                    definition += " PRIMARY KEY"
                    if col_type == 'INTEGER':
                        definition += " AUTOINCREMENT"
                elif self.dialect == 'postgresql':
                    if len([c for c in columns if c.get('primary_key')]) == 1:
                        definition = f"    {col_name} SERIAL PRIMARY KEY"
            
            if not col.get('nullable', True) and not col.get('primary_key'):
                definition += " NOT NULL"
            
            if col.get('unique') and not col.get('primary_key'):
                definition += " UNIQUE"
            
            col_definitions.append(definition)
        
        # Add composite primary key if multiple PK columns (non-sqlite)
        if pk_columns and len(pk_columns) > 1 and self.dialect != 'sqlite':
            pk_def = f"    PRIMARY KEY ({', '.join(pk_columns)})"
            col_definitions.append(pk_def)
        elif pk_columns and len(pk_columns) == 1 and self.dialect not in ['sqlite', 'postgresql']:
            pk_def = f"    PRIMARY KEY ({pk_columns[0]})"
            col_definitions.append(pk_def)
        
        # Add foreign key constraints
        if foreign_keys:
            for fk in foreign_keys:
                if isinstance(fk, (list, tuple)) and len(fk) >= 2:
                    local_col = self._safe_identifier(fk[0])
                    ref = fk[1]
                    if '.' in ref:
                        ref_table, ref_col = ref.split('.')
                        ref_table = self._safe_identifier(ref_table)
                        ref_col = self._safe_identifier(ref_col)
                        
                        if self.dialect == 'mysql':
                            fk_def = f"    FOREIGN KEY ({local_col}) REFERENCES {ref_table}({ref_col})"
                        else:
                            fk_def = f"    FOREIGN KEY ({local_col}) REFERENCES {ref_table}({ref_col}) ON DELETE CASCADE"
                        col_definitions.append(fk_def)
        
        columns_sql = ',\n'.join(col_definitions)
        
        return f"CREATE TABLE {safe_name} (\n{columns_sql}\n);"
    
    def _generate_inserts(self, table_name: str, records: List[Dict], 
                          columns: List[Dict] = None) -> List[str]:
        """Generate INSERT statements"""
        if not records:
            return []
        
        safe_table = self._safe_identifier(table_name)
        statements = []
        
        # Get column order from first record or columns definition
        if columns:
            col_order = [c.get('name') for c in columns if not c.get('primary_key') or c.get('name') in records[0]]
        else:
            col_order = list(records[0].keys())
        
        safe_cols = [self._safe_identifier(c) for c in col_order if c in records[0]]
        col_list = ', '.join(safe_cols)
        
        # Batch inserts for efficiency
        batch_size = 100
        
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            
            if self.dialect == 'postgresql':
                # PostgreSQL supports multi-row INSERT
                values_list = []
                for record in batch:
                    values = [self._escape_value(record.get(c)) for c in col_order if c in record]
                    values_list.append(f"({', '.join(values)})")
                
                statements.append(
                    f"INSERT INTO {safe_table} ({col_list})\nVALUES\n    " + 
                    ',\n    '.join(values_list) + ";"
                )
            else:
                # Individual inserts for broader compatibility
                for record in batch:
                    values = [self._escape_value(record.get(c)) for c in col_order if c in record]
                    statements.append(
                        f"INSERT INTO {safe_table} ({col_list}) VALUES ({', '.join(values)});"
                    )
        
        return statements
    
    def _map_type(self, data_type: str) -> str:
        """Map generic type to dialect-specific type"""
        type_upper = data_type.upper()
        type_map = self.TYPE_MAPPINGS.get(self.dialect, self.TYPE_MAPPINGS['postgresql'])
        
        # Handle VARCHAR(n) format
        varchar_match = re.match(r'VARCHAR\((\d+)\)', type_upper)
        if varchar_match:
            size = varchar_match.group(1)
            base = type_map.get('VARCHAR', 'VARCHAR')
            if 'VARCHAR' in base:
                return f"VARCHAR({size})"
            return base
        
        # Handle DECIMAL(p,s) format
        decimal_match = re.match(r'DECIMAL\((\d+),(\d+)\)', type_upper)
        if decimal_match:
            return data_type if self.dialect != 'sqlite' else 'REAL'
        
        # Direct mapping
        for key, value in type_map.items():
            if type_upper.startswith(key):
                return value
        
        return 'TEXT'
    
    def _safe_identifier(self, name: str) -> str:
        """Make identifier SQL-safe"""
        # Remove or replace special characters
        safe = re.sub(r'[^a-zA-Z0-9_]', '_', str(name))
        # Ensure doesn't start with number
        if safe and safe[0].isdigit():
            safe = 'col_' + safe
        # Quote if reserved word or contains special chars
        reserved = {'select', 'from', 'where', 'order', 'group', 'by', 'table', 
                    'index', 'key', 'primary', 'foreign', 'user', 'date', 'time'}
        if safe.lower() in reserved:
            if self.dialect == 'postgresql':
                return f'"{safe}"'
            elif self.dialect == 'mysql':
                return f'`{safe}`'
            else:
                return f'"{safe}"'
        return safe
    
    def _escape_value(self, value: Any) -> str:
        """Escape value for SQL"""
        if value is None:
            return 'NULL'
        
        if isinstance(value, bool):
            if self.dialect == 'mysql':
                return '1' if value else '0'
            return 'TRUE' if value else 'FALSE'
        
        if isinstance(value, (int, float)):
            return str(value)
        
        if isinstance(value, dict) or isinstance(value, list):
            # JSON value
            json_str = json.dumps(value)
            escaped = json_str.replace("'", "''")
            return f"'{escaped}'"
        
        # String value - escape single quotes
        str_val = str(value)
        escaped = str_val.replace("'", "''")
        return f"'{escaped}'"
    
    def deploy_to_supabase(self, sql_script: SQLScript, 
                           supabase_url: str, supabase_key: str,
                           db_password: str = None) -> DeploymentResult:
        """
        Deploy SQL to Postgres database using direct PostgreSQL connection
        """
        try:
            tables_created = []
            errors = []
            records_inserted = 0
            
            # Extract project ref from URL
            import re as regex
            url_match = regex.search(r'https://([^.]+)\.supabase\.co', supabase_url)
            if not url_match:
                return DeploymentResult(
                    success=False,
                    message="Invalid external DB URL format",
                    tables_created=[],
                    records_inserted=0,
                    errors=["Provide a valid DB host URL or DATABASE_URL"]
                )
            
            project_ref = url_match.group(1)
            
            # Split and analyze statements
            statements = self._split_statements(sql_script.full_script)
            
            for stmt in statements:
                stmt = stmt.strip()
                if not stmt:
                    continue
                
                # Track CREATE TABLE statements
                if 'CREATE TABLE' in stmt.upper():
                    match = re.search(r'CREATE TABLE\s+(?:IF NOT EXISTS\s+)?["\']?(\w+)["\']?', stmt, re.IGNORECASE)
                    if match:
                        tables_created.append(match.group(1))
                
                # Track INSERT statements
                if 'INSERT INTO' in stmt.upper():
                    row_matches = re.findall(r'\([^)]+\)', stmt.split('VALUES', 1)[-1] if 'VALUES' in stmt.upper() else '')
                    records_inserted += len(row_matches) if row_matches else 1
            
            # Try direct PostgreSQL connection
            try:
                import psycopg2
                from urllib.parse import quote_plus
                
                # Use the database password if provided, otherwise try API key
                password = db_password if db_password else supabase_key
                encoded_password = quote_plus(password)
                
                # Supabase-specific pooler format (kept for legacy support)
                conn_string = f"postgresql://postgres.{project_ref}:{encoded_password}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
                
                conn = psycopg2.connect(conn_string, connect_timeout=10)
                conn.autocommit = True
                cursor = conn.cursor()
                
                executed_count = 0
                for stmt in statements:
                    stmt = stmt.strip()
                    if not stmt:
                        continue
                    try:
                        cursor.execute(stmt)
                        executed_count += 1
                    except psycopg2.Error as e:
                        error_msg = str(e)
                        if 'already exists' not in error_msg.lower():
                            errors.append(f"SQL: {error_msg[:80]}")
                
                cursor.close()
                conn.close()
                
                success = len(errors) == 0 or len(tables_created) > 0
                return DeploymentResult(
                    success=success,
                    message=f"Deployed {len(tables_created)} tables with {records_inserted} records to Postgres!" if success else "Deployment had errors",
                    tables_created=tables_created,
                    records_inserted=records_inserted,
                    errors=errors[:5] if errors else [],
                    connection_string=supabase_url
                )
                
            except ImportError:
                errors.append("psycopg2 not installed. Run: pip install psycopg2-binary")
            except Exception as pg_error:
                errors.append(f"PostgreSQL connection error: {str(pg_error)[:100]}")
            
            # Fallback: Save SQL for manual execution
            import os
            sql_file_path = os.path.join(os.path.dirname(__file__), '..', 'temp', 'migration.sql')
            os.makedirs(os.path.dirname(sql_file_path), exist_ok=True)
            
            with open(sql_file_path, 'w', encoding='utf-8') as f:
                f.write(sql_script.full_script)
            
            return DeploymentResult(
                success=False,
                message=f"SQL saved for {len(tables_created)} tables. Manual deployment needed.",
                tables_created=tables_created,
                records_inserted=0,
                errors=errors + ["Run the SQL in your DB provider's SQL Editor"],
                connection_string=sql_file_path
            )
            
        except Exception as e:
            return DeploymentResult(
                success=False,
                message=f"Postgres deployment failed: {str(e)}",
                tables_created=[],
                records_inserted=0,
                errors=[str(e)]
            )

    def deploy_to_postgres(self, sql_script: SQLScript, database_url: str, db_password: str = None) -> DeploymentResult:
        """
        Deploy SQL to a Postgres database using a full DATABASE_URL connection string.
        """
        try:
            import psycopg2
            statements = self._split_statements(sql_script.full_script)
            tables_created = []
            errors = []
            records_inserted = 0

            conn = psycopg2.connect(database_url, connect_timeout=10)
            conn.autocommit = True
            cursor = conn.cursor()

            for stmt in statements:
                stmt = stmt.strip()
                if not stmt:
                    continue

                # Track CREATE TABLE statements
                if 'CREATE TABLE' in stmt.upper():
                    match = re.search(r'CREATE TABLE\s+(?:IF NOT EXISTS\s+)?["\']?(\w+)["\']?', stmt, re.IGNORECASE)
                    if match:
                        tables_created.append(match.group(1))

                # Track INSERT statements
                if 'INSERT INTO' in stmt.upper():
                    row_matches = re.findall(r'\([^)]+\)', stmt.split('VALUES', 1)[-1] if 'VALUES' in stmt.upper() else '')
                    records_inserted += len(row_matches) if row_matches else 1

                try:
                    cursor.execute(stmt)
                except Exception as e:
                    msg = str(e)
                    if 'already exists' not in msg.lower():
                        errors.append(msg)

            cursor.close()
            conn.close()

            success = len(errors) == 0
            return DeploymentResult(
                success=success,
                message=f"Deployed {len(tables_created)} tables with {records_inserted} records to Postgres!" if success else "Deployment had errors",
                tables_created=tables_created,
                records_inserted=records_inserted,
                errors=errors[:5] if errors else [],
                connection_string=database_url
            )
        except ImportError:
            return DeploymentResult(
                success=False,
                message="psycopg2 not installed. Run: pip install psycopg2-binary",
                tables_created=[],
                records_inserted=0,
                errors=["psycopg2 missing"]
            )
        except Exception as e:
            return DeploymentResult(
                success=False,
                message=f"Postgres deployment failed: {str(e)}",
                tables_created=[],
                records_inserted=0,
                errors=[str(e)]
            )

    def deploy_to_sqlite(self, sql_script: SQLScript, db_path: str) -> DeploymentResult:
        """Deploy SQL to SQLite database"""
        import sqlite3
        
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            tables_created = []
            errors = []
            
            statements = self._split_statements(sql_script.ddl + '\n' + sql_script.dml)
            
            for stmt in statements:
                if not stmt.strip():
                    continue
                
                try:
                    cursor.execute(stmt)
                    
                    if 'CREATE TABLE' in stmt.upper():
                        match = re.search(r'CREATE TABLE\s+(\w+)', stmt, re.IGNORECASE)
                        if match:
                            tables_created.append(match.group(1))
                except sqlite3.Error as e:
                    errors.append(f"SQLite error: {str(e)}")
            
            conn.commit()
            conn.close()
            
            return DeploymentResult(
                success=len(errors) == 0,
                message="Deployed to SQLite" if not errors else "Deployed with errors",
                tables_created=tables_created,
                records_inserted=sql_script.record_count,
                errors=errors,
                connection_string=db_path
            )
            
        except Exception as e:
            return DeploymentResult(
                success=False,
                message=f"SQLite deployment failed: {str(e)}",
                tables_created=[],
                records_inserted=0,
                errors=[str(e)]
            )
    
    def _split_statements(self, sql: str) -> List[str]:
        """Split SQL script into individual statements"""
        # Simple split by semicolon (doesn't handle all edge cases)
        statements = []
        current = []
        in_string = False
        
        for char in sql:
            if char == "'" and not in_string:
                in_string = True
            elif char == "'" and in_string:
                in_string = False
            elif char == ';' and not in_string:
                stmt = ''.join(current).strip()
                if stmt:
                    statements.append(stmt + ';')
                current = []
                continue
            current.append(char)
        
        # Don't forget the last statement
        if current:
            stmt = ''.join(current).strip()
            if stmt:
                statements.append(stmt)
        
        return statements
    
    def get_sql_summary(self, script: SQLScript) -> Dict:
        """Get summary of generated SQL"""
        return {
            'dialect': script.dialect,
            'table_count': script.table_count,
            'record_count': script.record_count,
            'ddl_lines': len(script.ddl.split('\n')),
            'dml_lines': len(script.dml.split('\n')),
            'total_size_kb': round(len(script.full_script) / 1024, 2)
        }
