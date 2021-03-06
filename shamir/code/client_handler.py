import socket
import sqlite3
import sys
import aes_crypt
import rsa_encrypt
import hashlib
import base64
import settings
import threading
import sqlite3
import shamir_updater
import time
import shamir_client


#set number for communication with webservers from file
comms_number = 0
with open(settings.assetsdir + "comms_number", "r") as c:
	comms_number = int(c.read())

#Host object to hold multicast information
class Host():
    def __init__(self):
        self.host = settings.MULT_ADDR
        self.port = settings.MULT_PORT

#Challenges the auth nodes to pick a single auth node to interact with for update purposes
def challenge():

    #create host object
    host = Host()

    #Create a hash of the node's public key to send to the auth node for identity verification
    keyhash = str(base64.b64encode(hashlib.sha256(rsa_encrypt.get_pub_key().exportKey("PEM")).digest()),'ascii')
    
    #creates a payload of the message that identifies that this is a client node that needs to be updated 
    payload = "imup" + ":" + str(comms_number) + ":" + keyhash + ":" + settings.ID

    #create a socket to communicate with the auth nodes
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP) as s:
        s.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 32)
        
        #Create an empty data and address variable and a socket to recieve the data
        data = ""
        addr = 0
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as us:
            
            #set a timeout for if there is no auth node ready
            us.settimeout(1)
            us.bind(('0.0.0.0', 55551))

            #send the challenge tag to the auth nodes along with a public key to encrypt their return message with
            s.sendto(aes_crypt.aes_enc(rsa_encrypt.get_pub_key_auth(), "who?:" + keyhash), ((host.host, host.port)))
            
            #Recv a number from the auth node to connect to
            try:
                data, addr = us.recvfrom(4096)
            #if it fails return an error
            except socket.timeout:
                us.close()
                return -1

        #Decrypt the recieved message
        data = aes_crypt.aes_dec(rsa_encrypt.get_priv_key(), data)

        #if message is bad return error
        if data == -1 or data == -2:
            return -1

        #convert data to a string to return to the auth nodes along with the instruction payload
        data = str(data, 'ascii')

        #send payload and return expected address
        s.sendto(aes_crypt.aes_enc(rsa_encrypt.get_pub_key_auth(), "you!:" + data + ":" + payload), ((host.host, host.port)))
        return addr

#Registers the client node with an auth node, updating its set of shares
def register():

    #Create socket to recieve updates from
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(5)
        s.bind(("0.0.0.0", 55550))
        s.listen(5)
        
        #make sure that challenge executes correctly, else return error
        print("Looking for Auth Node")
        address = challenge()
        if address == -1:
            return -1

        #Create a connection with the auth node, if it is not the 
        #expected address than continue waiting
        try:
            cli, addr = s.accept()
            while not addr[0] == address[0]:
                cli, addr = s.accept()
        except socket.timeout:
            return -1

        #Report
        print("Recieving Updates Now")

        #Recieve two sums for challenge response authentication
        #One for the database and one for the public key
        sums = cli.recv(2048).split(b"::")

        #Decrypt the sums using the node and db public keys
        sums[0] = aes_crypt.aes_dec(rsa_encrypt.get_priv_key(), sums[0])
        sums[1] = aes_crypt.aes_dec(rsa_encrypt.get_priv_key_db(settings.ID), sums[1])

        #if there is an error in the communication of the sums return an error
        if sums[0] == -1 or sums[0] == -2 or sums[1] == -1 or sums[1] == -2:
            return 1

        #Increment the sums and return them via the auth public key
        sum1 = str(int(sums[0]) + 1)
        sum2 = str(int(sums[1]) + 1)
        
        #send the incremented sums back to proove node identity
        payload = aes_crypt.aes_enc(rsa_encrypt.get_pub_key_auth(), sum1 + ":" + sum2)
        #Fill recv buffer
        cli.send(payload + b"\x00" * (4096-len(payload)))

        #Grab the latest timestamp
        timestamps = grab_timestamps()

        #Send the timestamp encrypted with the auth public key
        cli.send(aes_crypt.aes_enc(rsa_encrypt.get_pub_key_auth(), str(timestamps)))

        #Run the update process
        num_updates = shamir_updater.update(cli)
        
        #make number presentable
        if num_updates == -1:
            num_updates = 0
        
        #Report shares
        print("Registered: " + str(num_updates) + " updates")
        
        #clean up and exit
        cli.close()
    return


#Returns the newest timestamp from the device db
def grab_timestamps():
    #create a database connection
    conn = sqlite3.connect(settings.DBdir + settings.ID + ".db")
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    #initialize table if nonexistent
    c.execute("CREATE TABLE IF NOT EXISTS shares(id PRIMARY KEY, x, y, key, timestamp DOUBLE)")
    
    #Grab timestamps from the db
    c.execute("SELECT timestamp FROM shares")
    timestamps = c.fetchall()
    
    #initalize paylaod string
    payload = ""
    
    #handle for no timestamps
    if timestamps == None:
        payload = "0.0"

    #If timestamps exist then concatenate into strings
    else:
        for i in timestamps:
            payload = payload + str(i['timestamp']) + "|"
        payload = payload[:-1]

    #return the timestamp
    return payload


#Runs node registration every 3.5 minutes 
def timer_update_start():
    while 1 == 1:
        time.sleep(60 * 3.5)
        t = threading.Thread(target = register)
        t.start()

#Handles the registration of the node and its subsequent actions
def run():
    
    #Register node
    while register() == -1:
        time.sleep(30)
    
    #Start thread to send user shares to the auth node
    threading.Thread(target = timer_update_start).start()

    #Start periodic registration thread
    threading.Thread(target = shamir_client.start).start()