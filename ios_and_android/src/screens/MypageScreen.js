import React from 'react';
import { StyleSheet, View, Text, Image, ImageBackground, ScrollView } from 'react-native';
import { ButtonGroup, Icon } from 'react-native-elements';
import SideMenu from 'react-native-side-menu';
import firebase from 'firebase';

import UserLibraryImages from '../components/UserLibraryImages';
import Sidebar from '../components/Sidebar';

const Dimensions = require('Dimensions');

const { width } = Dimensions.get('window');

// eslint-disable-next-line
class MypageScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      allDataList: [],
      dataList: [],
      userData: [],
      selectedIndex: 0,
      sideMenuOpen: false,
      test: '',
    };
    this.updateIndex = this.updateIndex.bind(this);
    this.filterDataList = this.filterDataList.bind(this);
  }

  static navigationOptions = ({ navigation }) => ({
    headerTitle: 'Mypage',
    headerStyle: {
      position: 'absolute',
      backgroundColor: 'transparent',
      zIndex: 10,
      top: 0,
      left: 0,
      right: 0,
      borderBottomWidth: 0,
    },
    headerTitleStyle: {
      color:'transparent',
    },
    headerBackTitleStyle: {
      fontSize: 15,
    },
    headerRight: ( <Icon name="settings" iconStyle={{ marginRight: 10 }} color='#fff' onPress={() => navigation.state.params.openSideMenu()} underlayColor="transparent" /> ),
  });

  componentWillMount() {
    this.props.navigation.setParams({ openSideMenu: this.openSideMenu.bind(this) });
    const { currentUser } = firebase.auth();
    const userId = this.props.navigation.state.params ? this.props.navigation.state.params.user : currentUser.uid;
    const db = firebase.firestore();
    db.collection('users').doc(userId).get()  // 上部ユーザを詳細データ
      .then((querySnapshot)=> {
        this.setState({ userData: querySnapshot.data(), test: 'd1前user部' });
      });
    const allDataList = [];
    const dataList = [];
    const d1 = [];
    const d2 = [];
    db.collection(`users/${userId}/status`).orderBy('createdOnNumber', 'desc')
      .get()
      .then((querySnapshot) => { // ①自分がwantなどをしている画像データを抽出
        querySnapshot.forEach((doc) => {
          d1.push({ ...doc.data(), key: doc.id });
        });
        for (let i = 0; d1.length > i; i += 1) {
          db.collection('collections').doc(d1[i].key)　// ②コレクションを回して詳細取得
            .get()
            .then((doc) => {
              d2.push({ ...doc.data() }); // 各詳細画像データ
              allDataList[i] = Object.assign(d1[i], d2[i]);
              if (allDataList[i].want) {
                dataList.push(allDataList[i]);
              }
              if (allDataList.length === d1.length) {
                this.setState({
                  allDataList,
                  dataList,
                  sideMenuOpen: false,
                  test:'d2最後'
                });
              }
            });
        }
      });
  }

  openSideMenu() {
    this.setState({ sideMenuOpen: !this.state.sideMenuOpen })
  }

  filterDataList(selectStatus, selectedIndex) {
    const allDataList = this.state.allDataList;
    const dataList = [];
    for (let i = 0, len = allDataList.length; len > i; i += 1) {
      if (allDataList[i][selectStatus]) {
        dataList.push(allDataList[i]);
      }
    }
    this.setState({ dataList, selectedIndex,
      test: 'filter内'
     });
  }

  updateIndex(selectedIndex) {
    if (selectedIndex === 0) {
      this.filterDataList('want', selectedIndex);
    } else if (selectedIndex === 1) {
      this.filterDataList('favorite', selectedIndex);
    } else {
      this.filterDataList('clothete', selectedIndex);
    }
  }

  render() {
    console.log(this.state.test);
    const buttons = ['Want', 'Favorite', 'Clothete'];
    const { selectedIndex } = this.state;
    const menu = <Sidebar　userData={this.state.userData} navigation={this.props} />;
    return (
      <SideMenu
        menu={menu}
        isOpen={this.state.sideMenuOpen}
        edgeHitWidth={100}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
          <View>
            <ImageBackground
              source={{ uri: this.state.userData.backgroundImage }}
              style={styles.main}
              blurRadius={1} 
            >
              <Image
                source={{ uri: this.state.userData.userImage }}
                style={styles.userImage}
              />
              <Text style={styles.userName}>{this.state.userData.userName}</Text>
              <Text style={styles.userDescription}>{this.state.userData.userText}</Text>
              <View style={styles.statusButtonArea}>
                <ButtonGroup
                  onPress={this.updateIndex}
                  selectedIndex={selectedIndex}
                  buttons={buttons}
                  buttonStyle={styles.statusButton}
                  textStyle={styles.statusButtonText}                
                  selectedButtonStyle={styles.selectStatusButtons}
                  containerStyle={styles.statusButtons}
                  selectedTextStyle={{ color: '#333' }}
                  underlayColor="transparent"
                />
              </View>
            </ImageBackground>
          </View>
          <View>
            <UserLibraryImages navigation={this.props.navigation} dataList={this.state.dataList} />
          </View>
        </ScrollView>
      </SideMenu>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFEFF4',
  },
  main: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 10,
  },
  settingIcon: {
    fontSize: 25,
    color: '#fff',
  },
  userImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1.5,
    margin: 8,
  },
  userDescription: {
    color: '#fff',
    fontSize: 12,
  },
  statusButtonArea: {
    flexDirection: 'row',
    marginTop: 20,
  },
  statusButtons: {
    backgroundColor: 'rgba(200,200,200,0.8)',
    height: 32,
    width: width / 1.05,
    borderWidth: 0,
  },
  selectStatusButtons: {
    backgroundColor: 'rgba(255,255,255,1)',
  },
  statusButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
});

export default MypageScreen;
