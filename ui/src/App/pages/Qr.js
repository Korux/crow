import React, { Component } from 'react'
import QrReader from 'react-qr-reader'
import { FaArrowCircleRight } from 'react-icons/fa'

import QRCode from 'qrcode.react'

import './Qr.css'

export default class Qr extends Component {
    constructor(props){
        super(props)
        this.state = {
            result: 'No result',
            code: '',
        }
        this.registerQR = this.registerQR.bind(this)
    }

    // if the current scan returns fresh value to the
    // component state, decompose it into username and
    // password parts and send it to the backend for processing
    // after 5 seconds, delete scan from state
    handleScan = data => {
        if (data && this.state.result !== data) {
            console.log(data)
            this.setState({
                result: data
            })
            let colonPos = data.indexOf(':')
            let username = data.slice(0, colonPos)
            let password = data.slice(colonPos + 1)
            let register = this.props.register ? 1 : 0
            this.props.socket.emit('qrchannel', username, password, register)
            setTimeout(() => {
                this.setState({
                    result: 'No result'
                })
            }, 5000)
        }
    }

    // Log out any error messages that arise from the scanning process
    handleError = err => {
        console.error(err)
    }

    // this function will take the username and generated
    // password from the qr code and send it to the back-
    // end for registration
    registerQR(){
        let colonPos = this.state.code.indexOf(':')
        let username = this.state.code.slice(0, colonPos)
        let password = this.state.code.slice(colonPos + 1)
        this.props.socket.emit('qrchannel', username, password, 1)
    }

    // When the component mounts, generate a random QR message
    // to be encoded
    componentDidMount(){
        let username = this.props.username;
         //http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
        let password = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        this.setState({
            code: username + ':' + password
        })
    }

    // If in register mode, display the generated QR code
    // otherwise, scan the user's webcam for QR codes
    render() {
        return (
            <>
                {this.props.register &&
                    <div className='QRcontainer'>
                        <QRCode style={{
                            margin: '10% auto 5% auto',
                            width: '50vh',
                            maxWidth: '50%',
                            height: '50%'}}
                            value={this.state.code} />
                    <h2 style={{marginBottom: '3%'}}>Save this QR and continue</h2>
                    <FaArrowCircleRight className='clickable' onClick={this.registerQR} size={48} />
                </div>
                }
                {!this.props.register &&
                    <div style={{
                        height: '90%',
                        display: "flex",
                        justifyContent: "center",
                        flexDirection: "column",
                        alignItems: "center"
                    }}>
                        {this.state.result === 'No result' &&
                            <h1 style={{ fontSize: '4em' }}>Scan your QR Code</h1>}
                        {this.state.result !== 'No result' &&
                            <h1 style={{ fontSize: '4em' }}>QR scan has been received!</h1>}
                        <QrReader
                            delay={300}
                            onError={this.handleError}
                            onScan={this.handleScan}
                            style={{ width: '40%' }}
                        />
                    </div>
                }
            </>
        )
    }
}