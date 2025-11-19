'''
Business: API для управления записями веса - добавление нового веса и получение истории
Args: event с httpMethod, body, queryStringParameters; context с request_id
Returns: HTTP response с данными о весе и статистикой
'''

import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, date
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if method == 'GET':
            cursor.execute('''
                SELECT id, weight_kg, entry_date, created_at 
                FROM weight_entries 
                ORDER BY entry_date DESC
            ''')
            entries = cursor.fetchall()
            
            entries_list: List[Dict[str, Any]] = []
            for entry in entries:
                entries_list.append({
                    'id': entry['id'],
                    'weight_kg': float(entry['weight_kg']),
                    'entry_date': entry['entry_date'].isoformat(),
                    'created_at': entry['created_at'].isoformat()
                })
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'entries': entries_list})
            }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            weight_kg = float(body_data.get('weight_kg'))
            entry_date_str = body_data.get('entry_date', date.today().isoformat())
            
            cursor.execute('''
                INSERT INTO weight_entries (weight_kg, entry_date)
                VALUES (%s, %s)
                ON CONFLICT (entry_date) 
                DO UPDATE SET weight_kg = EXCLUDED.weight_kg
                RETURNING id, weight_kg, entry_date, created_at
            ''', (weight_kg, entry_date_str))
            
            new_entry = cursor.fetchone()
            conn.commit()
            
            cursor.execute('''
                SELECT weight_kg, entry_date 
                FROM weight_entries 
                WHERE entry_date < %s
                ORDER BY entry_date DESC 
                LIMIT 1
            ''', (entry_date_str,))
            
            previous_entry = cursor.fetchone()
            
            comparison: Optional[str] = None
            if previous_entry:
                if weight_kg > float(previous_entry['weight_kg']):
                    comparison = 'increased'
                elif weight_kg < float(previous_entry['weight_kg']):
                    comparison = 'decreased'
                else:
                    comparison = 'same'
            
            result = {
                'id': new_entry['id'],
                'weight_kg': float(new_entry['weight_kg']),
                'entry_date': new_entry['entry_date'].isoformat(),
                'created_at': new_entry['created_at'].isoformat(),
                'comparison': comparison
            }
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps(result)
            }
        
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cursor.close()
        conn.close()
