import socket
import sqlite3
import sys
import aes_crypt
import rsa_encrypt

class Host():
    def __init__(self):
        self.host = "224.3.29.1"
        self.port = 13337

def send_share(share, host):
    payload = share['id'] + ":" + share['x'] + ":" + share['y']
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP) as s:
        s.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 32)
        s.sendto(aes_crypt.aes_enc(rsa_encrypt.get_pub_key_auth(), payload), ((host.host, host.port)))
        return

def grab(user, n): 
    conn = sqlite3.connect(n + ".db")
    conn.row_factory = sqlite3.Row 
    c = conn.cursor()
    c.execute("SELECT * FROM shares WHERE id = \""+ user +"\"")
    inc = c.fetchone()
    conn.close()
    return inc

def auth_user(user, db,key):
    #UNCOMMENT LINES TO IMPLEMENT KEY CHECKING
    share = grab(user, db)
    '''
    if key == share["key"] and not key == "":
        send_share(share, host)
        return 1
    return 0 
    '''   
    send_share(share, host)
    return 1

host = Host()
auth_user(str(sys.argv[1]), str(sys.argv[2]), "0000")