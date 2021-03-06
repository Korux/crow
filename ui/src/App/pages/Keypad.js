import React from 'react'
import './keypad.css'
import Cookies from 'universal-cookie'
const cookies = new Cookies();

var pw = ''

export default class Keypad extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            opened: false || this.props.register
        };


        this.togglescreen = this.togglescreen.bind(this)
        this.enter = this.enter.bind(this)
        this.style_btn_press = this.style_btn_press.bind(this)
        this.clr = this.clr.bind(this)
        this.check_complete = this.check_complete.bind(this)
        this.update_cookie = this.update_cookie.bind(this)
    }

    // used to toggle between welcome screen and keypad screen
    togglescreen() {
        const { opened } = this.state;
        this.setState({
            opened: !opened,
        })
    }

    // Set the cookie to contain the current user's username
    update_cookie = event => {
        event.preventDefault();

        let username = document.getElementById('i_username').value

        cookies.set('username', username)
        this.togglescreen();
    }

    // clear the password and placeholder asterisks
    clr() {
        let btn = document.getElementById("clr");
        this.style_btn_press(btn);
        var entry = document.getElementById("entry");
        entry.innerHTML = '';
        pw = '';
        return 1;
    }

    // Used to grab the username from user
    WelcomePage() {
        return (
            <div id="scr_1">
                <div className="centered" id="welcome">
                    <div className="window">
                        <div className="w_header">
                            <h1>Howdy!</h1>
                        </div>
                        <div className="w_content">
                            <h2>Please enter your username:</h2>
                            <form onSubmit={this.update_cookie}>
                                <input id="i_username" type="text" name="username" autoFocus />
                            </form>
                        </div>
                    </div>
                </div>
            </div >
        )
    }

    // Called whenever a digit is added to the PIN
    check_complete() {
        // if the PIN is the desired length, send it to the backend
        if (pw.length >= 6) {
            var http = new XMLHttpRequest();
            var url = 'https://' + window.location.hostname + ':3001' + '/auth';
            http.open('POST', url, true);

            //Send the proper header information along with the request
            http.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
            let shouldRegister = this.props.register ? 1 : 0;
            http.send(JSON.stringify({
                "username": shouldRegister ? "" : cookies.get('username'),
                "pw": pw,
                "register": shouldRegister }));

            // Clear the password
            pw = '';
            // reset placeholder asterisks back to 0
            this.clr();
        }
    }

    // This function changes subtle style options and
    // reverts them back after .25 seconds to simulate the
    // feel of depressing a button
    style_btn_press(btn) {
        btn.style.boxShadow = "-2px -2px 12px 0 rgba(255,255,255,.5), 2px 2px 12px 0 rgba(0,0,0,.03)";
        btn.style.fontSize = "3.7em";
        btn.style.color = "grey";
        setTimeout(function () {
            btn.style.boxShadow = "-6px -6px 12px 0 rgba(255,255,255,.5), 12px 12px 12px 0 rgba(0,0,0,.03)";
            btn.style.fontSize = "4em";
            btn.style.color = "black";
        }, 250);
    }

    // Called whenever a keypad button is pressed
    enter(i) {
        var entry = document.getElementById("entry");
        let btn = document.getElementById(i);
        // change size of button and add shadow for effect
        this.style_btn_press(btn);
        // append the button's number value to the password
        pw += i.toString();
        // indicate to the user how many digits they have entered
        entry.innerHTML += '*'
        // check if the user has submitted enough digits to complete the PIN
        this.check_complete();
        return 1;
    }



    render() {
        const opened = this.state.opened
        return (
            <div className='outer'>
                {!opened && this.WelcomePage()} 

                {opened &&
                    <div id="scr_2">
                        <h1 id="entry" className="entry"></h1>

                        <div className="grid">
                            <div className="row">
                                <button className="cell" id="1" onClick={() => this.enter(1)}>1</button>
                                <button className="cell" id="2" onClick={() => this.enter(2)}>2</button>
                                <button className="cell" id="3" onClick={() => this.enter(3)}>3</button>
                            </div>{}
                            <div className="row">{}
                                <button className="cell" id="4" onClick={() => this.enter(4)}>4</button>
                                <button className="cell" id="5" onClick={() => this.enter(5)}>5</button>
                                <button className="cell" id="6" onClick={() => this.enter(6)}>6</button>
                            </div>{}
                            <div className="row">{}
                                <button className="cell" id="7" onClick={() => this.enter(7)}>7</button>
                                <button className="cell" id="8" onClick={() => this.enter(8)}>8</button>
                                <button className="cell" id="9" onClick={() => this.enter(9)}>9</button>
                            </div>
                            <div className="row">
                                <div className="cell hidden"></div>
                                <button className="cell" id="0" onClick={() => this.enter(0)}>0</button>
                                <button className="cell" id="clr" onClick={this.clr}>Clear</button>
                            </div>
                        </div>
                    </div>
                }
            </div>
        )
    }

}

