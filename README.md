# Apps.Jitsi
Rocket.Chat App for Jitsi

## Installation
Install the app via the Rocket.Chat Marketplace or download the source code and build the app by yourself. You would need the [Rpcket.Chat App Engine CLI](https://docs.rocket.chat/apps-development/getting-started/rocket.chat-app-engine-cli) to do so. To deploy a self-build app to your server, make sure to have the App development mode enabled (`Administration - General - Apps - Enable develpment mode`). Use the following command to deploy the app:
`rc-apps deploy --url http://localhost:3000 --username <username> --password <password>`

## Usage
This app provides a Slashcommand. Simply type `/jitsi` in any message window and send the message. You can set a custom room name by adding the @ symbol to the message `/jitsi @MyRoomExample`. Please note that this app uses the Jitsi server specified in your Rocket.Chat Video settings: `Administration - Video Conference - Jitsi`

## Settings
The following settings can be set via `Administration - Apps - Jitsi Slash Command`

### JWT Token
When authentication via JSON Web Tokens (JWT) is enabled on your Jitsi instance, you may want to add a static token for each conference link generated to allow users to enter the conference. This token can be generated here: [jwt.io](https://jwt.io/). It is recommended to set an expiration date when creating the token. The token can not be limited to a dedicated room as the same token is added to every conference link. 
To set the JWT Token, just paste to the corresponding text box in your app settings. 
