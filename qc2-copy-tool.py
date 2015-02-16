#!/usr/bin/python3

import sqlite3
import urllib.request
import gzip
import re

LOCALSTORAGE_PATH = '/home/llama/.config/chromium/Default/Local Storage/'

def get_qc2_data(site):
    conn = sqlite3.connect(LOCALSTORAGE_PATH + 'http_%s_0.localstorage' % site)
    c = conn.cursor()

    c.execute('SELECT CAST(value AS TEXT) FROM ItemTable WHERE key = \'qc2\';')
    qc2 = c.fetchone()[0]

    conn.close()
    return qc2

def copy_data_to(data, site):
    try:
        conn = sqlite3.connect(LOCALSTORAGE_PATH + 'http_%s_0.localstorage' % site)
        c = conn.cursor()

        c.execute('INSERT OR REPLACE INTO ItemTable (key, value) VALUES (\'qc2\', ?)', (data,))

        conn.commit()
        conn.close()
    except sqlite3.OperationalError:
        print('warning: site %s not found' % site)

def get_sites():
    return re.findall(r'http://(.*?)"', str(gzip.GzipFile(fileobj=urllib.request.urlopen('http://api.stackexchange.com/2.2/sites?pagesize=500&filter=!SmNnfYtt-PkOXruW4z')).read()))

data = get_qc2_data('codegolf.stackexchange.com')
for site in get_sites():
    copy_data_to(data, site)
