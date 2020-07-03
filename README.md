# The Fifth World Server

This project provides the code for the server that runs the [Fifth World website](https://thefifthworld.com). For the most part, it calls content from the [Fifth World API](https://github.com/thefifthworld/api), presents it using the [Fifth World Design System](https://github.com/thefifthworld/design), and returns the response. The biggest exception lies in authentication, which the server handles itself (relying on [Passport.js](http://www.passportjs.org/)).

## Installation

To install and run the server, follow these instructions in order:

```
mkdir thefifthworld
cd thefifthworld
git clone https://github.com/thefifthworld/server.git
cd server
npm install
npm start
```
