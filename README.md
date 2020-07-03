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

## Contributing

We’d love to work with you to improve the Fifth World website. f you’ve never contributed to a Github project before, you might want to take a look at the [Hello World Github Guide](https://guides.github.com/activities/hello-world/), which walks you through a lot of the basics, like what repositories, commits, and branches mean, and how to use them.

Most contributions may require contributions to [the API](https://github.com/thefifthworld/api) and/or [the design system](https://github.com/thefifthworld/design) first, before the server can make use of those changes. Each of these three projects have certain peculiarities, but we’ve tried to make the process as similar as possible between them.

To contribute to the server, you’ll need to run it locally to make sure your changes work. See the _Installation_ section above for more on how to do that. Next, you’ll need to check out the `develop` branch and create a new branch from that. Use this format for your branch name: `TYPE/NAME-NUM-DESC` 

| Element | Notes |
| --- | --- |
| `TYPE` | <p>One of the following:</p><ul><li>`bug` if your branch addresses a bug or problem. A bug fix doesn’t add new functionality to the system, it just fixes something broken.</li>`feature` if your branch adds a new feature to the system. Even if you believe the system lacking this feature constitutes a huge oversight, it counts as a new feature, not a bug fix.</li><li>`doc` if your branch adds or fixes documentation around the system (for example, these instructions).</li><li>`system` if your branch addresses how the system works (e.g., dependency updates or how the design tokens are parsed).</li></ul>
| `NAME` | Your Github username.
| `NUM` | If your branch addresses [a reported issue](https://github.com/thefifthworld/server/issues), put the number for that issue in the branch name.
| `DESC` | A single word or a very short phrase that describes what the branch does or addresses. Write it all in lowercase, with dashes to replace spaces.

_**Example:** I write these instructions in a branch called `doc/jefgodesky-how-to-contribute`. It deals with documentation, I have the Github username [jefgodesky](https://github.com/jefgodesky), and we don’t have a Github issue for writing these instructions, so I have no number to refer to._

Next comes the hard part: actually making the changes you’d like to see. Run the server locally to make sure that your changes work and don’t cause any unexpected side effects. When you feel confident that you’ve finished it, push your branch and [make a pull request](https://github.com/thefifthworld/server/compare) to merge your branch back into the `develop` branch. Pull requests create a space for you and the people who administer the server project to collaborate on your changes. Sometimes they’ll approve your changes right away and the process will go very quickly. Other times they might have comments, questions, or suggestions for you. We’ll work together to make sure that we make the best website we can.

Once approved, your work gets merged back into the `develop` branch. When we’ve gotten enough changes, we merge the `develop` branch into the `main` branch to create a new release — at which point, your contribution becomes part of the Fifth World website!
