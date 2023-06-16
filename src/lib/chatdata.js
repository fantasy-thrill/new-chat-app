import { CometChat } from "@cometchat-pro/chat";
import config from "../config";

export default class CCManager {
  static LISTENER_KEY_MESSAGE = "msglistener";
  static appID = config.appID;
  static apiKey = config.apiKey;
  static LISTENER_KEY_GROUP = "grouplistener";
  static init() {
    const appSetting = new CometChat.AppSettingsBuilder()
      .subscribePresenceForAllUsers()
      .setRegion("US")
      .build();
    return CometChat.init(CCManager.appID, appSetting);
  }
  static getTextMessage(UID, text, msgType) {
    if (msgType === "user") {
      return new CometChat.TextMessage(
        UID,
        text,
        CometChat.RECEIVER_TYPE.USER
      );
    } else {
      return new CometChat.TextMessage(
        UID,
        text,
        CometChat.RECEIVER_TYPE.GROUP
      );
    }
  }
  static getLoggedinUser() {
    return CometChat.getLoggedinUser();
  }
  static login(UID) {
    return CometChat.login(UID, this.apiKey);
  }
  static getGroupMessages(GUID, callback, limit = 30) {
    const messagesRequest = new CometChat.MessagesRequestBuilder()
      .setGUID(GUID)
      .setLimit(limit)
      .build();
    callback();
    return messagesRequest.fetchPrevious();
  }
  static messagesRequest(UID, limit) {
    const messagesRequest = new CometChat.MessagesRequestBuilder()
      .setUID(UID)
      .setLimit(limit)
      .build();
    return messagesRequest.fetchPrevious()
  }
  static conversationsRequest() {
    return new CometChat.ConversationsRequestBuilder()
     .setLimit(30)
     .setConversationType("user")
     .build()
  }
  static sendIndividualMessage(UID, message) {
    const textMessage = this.getTextMessage(UID, message, "user");
    return CometChat.sendMessage(textMessage);
  }
  static sendGroupMessage(GUID, message) {
    const textMessage = this.getTextMessage(GUID, message, "group");
    return CometChat.sendMessage(textMessage);
  }
  static joinGroup(GUID) {
    return CometChat.joinGroup(GUID, CometChat.GROUP_TYPE.PUBLIC, "");
  }
  static getGroupMembers(GUID) {
    return new CometChat.GroupMembersRequestBuilder(GUID).setLimit(100).build()
  }
  static addMessageListener(firstCallback) {
    CometChat.addMessageListener(
      this.LISTENER_KEY_MESSAGE,
      new CometChat.MessageListener({
        onTextMessageReceived: textMessage => {
          firstCallback(textMessage);
        }
        // onMessagesDelivered: messageReceipt => {
        //   secondCallback(messageReceipt)
        // },
        // onMessagesRead: messageReceipt => {
        //   thirdCallback(messageReceipt)
        // }
      })
    );
  }
  static eventReceipts(messageID) {
    CometChat.getMessageReceipts(messageID)
      .then(
        receipts => {
          console.log("Message details fetched:", receipts);
        },
        error => {
          console.log("Error in getting message details:", error);
        }
      )
  }
  static markAsDelivered(message) {
    CometChat.markAsDelivered(message)
     .then(
      () => {
        console.log("Message delivered");
      },
      (error) => {
        console.log("Message not delivered:", error.message);
      }
     )
  }
  static markAsRead(message) {
    CometChat.markAsRead(message)
     .then(
      () => {
        console.log("Message read");
      },
      (error) => {
        console.log("Message not read:", error.message);
      }
     )
  }
  static logout() {
    CometChat.logout()
      .then(() => { console.log("Logout successful") })
      .catch(error => { console.log("Logout failed with error:", error) }) 
  }
}
