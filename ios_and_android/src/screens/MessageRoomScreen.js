import React from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TextInput, TouchableHighlight, KeyboardAvoidingView, Dimensions, ActivityIndicator } from 'react-native';
import { Icon } from 'react-native-elements';
import firebase from 'firebase';

import Messages from '../components/Messages';

const { width, height } = Dimensions.get('window');

class MessageRoomScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      myId: '',
      otherId: '',
      myName: '',
      otherName: '',
      myImage: '',
      otherImage: '',
      text: '',
      messages: [],
      contentHeight: 0,
      loading: true,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }
    static navigationOptions = ({ navigation }) => {
      return{
        headerTitle: `${navigation.state.params.userData.userName}`,
      }
    }

  componentWillMount() {
    const { userId, userData } = this.props.navigation.state.params;
    const { currentUser } = firebase.auth();
    const db = firebase.firestore();
    db.collection('users').doc(currentUser.uid)
      .get()
      .then((doc) => {
        this.setState({
          myId: currentUser.uid,
          otherId: userId,
          myName: doc.data().userName,
          otherName: userData.userName,
          myImage: doc.data().userImage,
        });
      });
    db.collection('messages')
      .where('postUserId', '==', currentUser.uid)
      .where('otherId', '==', userId)
      .onSnapshot((querySnapshot) => {
        const messages = [];
        if (!querySnapshot.empty) {
          querySnapshot.forEach((doc) => {
            messages.push(doc.data());
          });
        }
        db.collection('messages')
          .where('postUserId', '==', userId)
          .where('otherId', '==', currentUser.uid)
          .onSnapshot((_querySnapshot) => {
            const _messages = [];
            if (!_querySnapshot.empty) {
              _querySnapshot.forEach((_doc) => {
                _messages.push(_doc.data());
              });
            }
            _messages.push(...messages);
            _messages.sort((a, b) => (
              a.createdOnNumber > b.createdOnNumber ? 1 : -1
            ));
            this.setState({
              messages: _messages,
              otherImage: userData.userImage,
              loading: false,
            });
          });
      });
  }

  handleSubmit() {
    const time = new Date();
    const strTimestamp = String(time.getTime());
    const timestamp = time.toLocaleString().replace(/\//g, '_');
    const preUserList = [this.state.myId, this.state.otherId];
    const userList = preUserList.sort()
    const messageRoom = `${userList[0]}_${userList[1]}`
    const db = firebase.firestore();
    db.collection('messages').doc(timestamp)
      .set({
        postUserId: this.state.myId,
        otherId: this.state.otherId,
        text: this.state.text,
        messageRoom: messageRoom,
        createdOn: timestamp,
        createdOnNumber: strTimestamp,
      })
      .then(() => {
        this.setState({ text: '' });
      });
  }

  render() {
    if (this.state.loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#777" />
        </View>
      );
    }
    const { userData } = this.props.navigation.state.params;
    return (
      <View style={styles.docs}>
        <KeyboardAvoidingView
          behavior="position"
          keyboardVerticalOffset={40}
        >
          <ScrollView
            style={styles.container}
            ref={ref => this.scrollView = ref}
            onContentSizeChange={(contentWidth, contentHeight)=>{
                this.scrollView.scrollToEnd({animated: true});
            }}>
            <Messages
              messages={this.state.messages}
              userData={userData}
              myId={this.state.myId}
              myImage={this.state.myImage}
              otherId={this.state.otherId}
            />
          </ScrollView>
          <View style={styles.inputForm}>
            <View style={styles.commentInputArea}>
              <TextInput
                value={this.state.text}
                multiline
                placeholder="メッセージを入力"
                style={styles.commentInput}
                onChangeText={text => this.setState({ text })}
              />
              <TouchableHighlight
                style={styles.submitButton}
                underlayColor="transparent"
                onPress={this.handleSubmit}
              >
                <Icon name="send" size={20} color="#fff" />
              </TouchableHighlight>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    height: height - 180,
  },
  inputForm: {
    padding: 8,
  },
  commentInputArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingLeft: 8,
    paddingBottom: 16,
    paddingRight: 8,
  },
  commentInput: {
    borderColor: '#999',
    borderWidth: 1,
    borderRadius: 20,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 8,
    paddingRight: 8,
    width: width / 1.3,
  },
  submitButton: {
    padding: 8,
    backgroundColor: '#44B26B',
    borderRadius: 60,
  },
  submitButtonText: {
    color: '#fff',
  },
});


export default MessageRoomScreen;
