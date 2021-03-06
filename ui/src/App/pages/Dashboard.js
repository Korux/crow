import React from 'react'
import { Container, Row, Col, Button } from 'react-bootstrap'
import { GiSpeaker, GiCyborgFace, GiLockedFortress } from 'react-icons/gi'
import { FaBarcode, FaGlobe, FaServer, FaArrowCircleRight } from 'react-icons/fa'
import { IconContext } from "react-icons";
import Modal from 'simple-react-modal'

import './Dashboard.css'

export default class Dashboard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            nodes: [],
            msgs: [],
            usrs: [],
            show: false,
        }

        this.initiateRegister = this.initiateRegister.bind(this)
    }

    // Listen for new data coming in on testchannel
    // parse it for useful information 
    componentDidMount() {
        const socket = this.props.socket;
        if (this.props.savedState !== null) {
            this.setState(this.props.savedState)
        }
        socket.on('testchannel', (data) => {
            this.parse_data(data.split('\n'))
        })
        this.scrollToBottom();
    }

    // when other screens are visited,
    // persist the state of the dashboard
    componentWillUnmount() {
        this.props.liftState(this.state)
    }

    // show the registration modal
    show(){
        this.setState({show: true})
    }

    // hide the registration modal
    hide(){
        this.setState({show: false})
    }

    // Retrieve useful information from the stdout of crow_caw
    parse_data(d) {
        d.forEach(element => {
            if (element === '') {
                return;
            }
            // If a new node is being registered,
            // add it to the node visual and log a message
            if (element.includes("Node registered")) {
                let nodeType = element.split(': ')[1].trim()
                console.log("REGISTERED " + nodeType)
                this.setState(prevState => ({
                    nodes: [...prevState.nodes, nodeType],
                    msgs: [...prevState.msgs, 'REGISTERED NEW NODE TYPE: ' + nodeType]
                }))
                return;
            }

            // If a share submission is detected
            if (element.includes("has submitted")) {
                let usr = element.split(' ')[0].trim();


                // increment the given users share if they exist
                if (this.state[usr]){
                    this.setState(prevState => ({
                        msgs: [...prevState.msgs, usr + ' SUBMITTED A SHARE'],
                        [usr]: prevState[usr] + 1,
                    }))
                }

                // Create the user and give them one share in the visual
                else {
                    this.setState(prevState => ({
                        msgs: [...prevState.msgs, usr + ' SUBMITTED A SHARE'],
                        usrs: [...prevState.usrs, usr],
                        [usr]: 1
                    }))
                }

                return;
            }

            // If a user has been authorized
            if (element.includes("is Authorized")) {
                var who = element.substring(
                    element.indexOf("(") + 1,
                    element.indexOf(")")
                );

                // create a message that they have been authorized
                this.setState(prevState => ({
                    msgs: [...prevState.msgs, who + ' HAS BEEN AUTHORIZED']
                }))
                return;
            }

            // Log out this simple message
            if (element === 'Looking for updates') {
                console.log('LOOKING')
                this.setState(prevState => ({
                    msgs: [...prevState.msgs, 'LOOKING FOR UPDATES']
                }))
                return;
            }

            // Log out this simple message
            if (element === 'Sending New Share to other Auth Nodes') {
                console.log("UPDATING OTHER AUTHS")
                this.setState(prevState => ({
                    msgs: [...prevState.msgs, "UPDATING OTHER AUTHS"]
                }))
            }

            // Log out this simple message
            if (element === 'Recieved Share from Client Node') {
                console.log("RECEIVED")
                this.setState(prevState => ({
                    msgs: [...prevState.msgs, "RECEIVED SHARE FROM A CLIENT"]
                }))
                return;
            }

            // Log out this simple message
            if (element === 'Sending Update to Client Node') {
                console.log("SENDING UPDATES")
                this.setState(prevState => ({
                    msgs: [...prevState.msgs, "SENDING UPTDATE TO CLIENT NODES"]
                }))
                return;
            }

            // Log out this simple message
            if (element === "Got Share") {
                console.log("RECEIVED2")
                this.setState(prevState => ({
                    msgs: [...prevState.msgs, "ALTERNATIVE SHARE RECEIVED"]
                }))
                return
            }

            // If message doesn't match any of the previous 
            // patterns, log it out too 
            this.setState(prevState => ({
                msgs: [...prevState.msgs, "MESSAGE: " + element]
            }))
        });
    }

    // When state updates, smooth scroll the output log to its bottom
    componentDidUpdate() {
        this.scrollToBottom();
    }

    // smooth scroll to bottom to keep new messages in focus
    scrollToBottom() {
        this.el.scrollIntoView({ behavior: 'smooth' });
    }

    // Check if username and fullname are both supplied
    // before initiating the register script on the backend
    initiateRegister() {
        let username = document.getElementById("username").value
        let fullname = document.getElementById("fullname").value
        if (username === '' || fullname === ''){
            document.getElementById("send-arrow").style.color = 'red';
        }
        else {
            this.props.registerHandler(username, fullname)
        }
    }

    render() {
        return <div style={{ height: "100%" }}>
            <Button className="register-btn" variant="dark" onClick={this.show.bind(this)}>
                Register a new user
            </Button>
            <Modal
                className="username-modal" //this will completely overwrite the default css 
                containerClassName="modal-container"
                closeOnOuterClick={true}
                show={this.state.show}
                onClose={this.hide.bind(this)}>
                <h3 className="modal-title">Register a New User</h3>
                <div className="modal-background">
                    <div className="input-boxes">
                        <input id='username' placeholder="username"></input>
                        <input id='fullname' placeholder="fullname"></input>
                    </div>
                    <div id='send-arrow' className="icon-holder">
                        <FaArrowCircleRight className="clickable" onClick={this.initiateRegister} size={32}/>
                    </div>
                </div>

                </Modal>
            <h3 className="section_heading">Nodes Online</h3>
            <RenderMap active={this.state.nodes} threshold={this.props.threshold} />
            <br></br>

            <Container fluid style={{ height: '40%', width: "95%" }}>
                <Row style={{ height: '5%', width: 'auto' }}>
                    <h3 className="section_heading" style={{width: '45%', marginLeft: '0px'}} >Output Log</h3>
                    <h3 className="section_heading" style={{width: '45%'}} >Current Users</h3>
                </Row>
                <Row style={{ height: '90%', width: 'auto' }}>
                    <div className="col log overflow-auto">
                        {this.state.msgs && this.state.msgs.map((item, i) => <p key={i}>{item}</p>)}
                        <div ref={el => { this.el = el; }} />
                    </div>
                    <div className="col" style={{margin: '0px'}}>
                        <Container fluid style={{ height: '100%', width: "100%", borderStyle: 'none' }}>
                            <Row style={{ height: '100%', width: 'auto' }}>
                                {this.state.usrs &&
                                    this.state.usrs.map((usr, i) =>
                                        <ShareCounter key={i} usr={usr} num={this.state[usr]} threshold={this.props.threshold} total={this.props.total} />)}
                            </Row>
                        </Container>
                    </div>
                </Row>
            </Container>
            <br></br>
        </div>
    }
}

// this function creates a bar indicater to show how many
// shares a user has submitted
// it takes the following as props:
// total - total number of shares
// threshold - threshold value for registration
// num - number of shares designated user has
// usr - the username to display
function ShareCounter(props) {
    return <Col>
    <Container>
        {
          (props.total - props.num > 0) &&
            Array(props.total - props.num).fill(' ').map((_, i) => {
            return <Row key={i} className='empty' style={{ height: '50px', width: '50px', margin: '0 auto 0 auto'}}></Row>
        })}
        {Array(Math.min(props.total, props.num)).fill(' ').map((_, i) => {
            return <Row key={i} className={props.num >= props.threshold ? 'authorized' : 'unauthorized'} style={{ height: '50px', width: '50px', margin: '0 auto 0 auto'}}></Row>
        })}
    </Container>
        <p>{props.usr} ({props.num}/{props.threshold})</p>
    </Col>
}

// this function takes care of displaying whichever nodes are 
// currently in state (the nodes that have been registered to the backend)
function RenderMap(props) {
    return <Container fluid className={props.active.length < props.threshold ? 'unauthorized' : ''} style={{ width: "95%" }}>
        <Row style={{width: 'auto'}}>
            <RenderIcon icon={<GiLockedFortress />} label={'Auth Node'} />
        </Row>
        <Row style={{width: 'auto'}}>
            {props.active && props.active.map((nodeType, i) => {
                switch(nodeType){
                    case 'face':
                        return <RenderIcon key={i} icon={<GiCyborgFace />} label={'Face ID'} />
                    case 'web':
                        return <RenderIcon key={i} icon={<FaGlobe />} label={'Web ID'} />
                    case 'other':
                        return <RenderIcon key={i} icon={<FaServer />} label={'Unknown Node'} />
                    case 'voice':
                        return <RenderIcon key={i} icon={<GiSpeaker />} label={'Speech ID'} />
                    case 'qr':
                        return <RenderIcon key={i} icon={<FaBarcode />} label={'QR Scan ID'} />
                }
            })}
        </Row>
    </Container>

}

function RenderIcon(props) {
    return <IconContext.Provider value={{ size: '5em' }}>
        <Col>
            {props.icon}
            <h3>{props.label}</h3>
        </Col>
    </IconContext.Provider>
}