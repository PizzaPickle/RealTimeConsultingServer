import { getRoomList, getConsultingRoomInfo } from './redis_client.js';

function socketHandler(wsServer) {
  console.log('소켓 핸들러 함수 시작');

  wsServer.on('connection', socket => {
    console.log('소켓 연결됨');

    socket.on('requestRoomList', async ({ userId }) => {
      console.log('1. requestRoomList');
      try {
        const roomList = await getRoomList(userId);
        socket.emit('receiveRoomList', JSON.stringify(roomList));

        socket.disconnect(true);
      } catch (error) {
        console.error('RoomList 조회 중 에러 발생:', error);
      }
    });

    socket.on('joinConsultingRoom', async ({ roomId, userId, userName }) => {
      console.log('2. joinConsultingRoom');
      console.log(roomId, userId);
      try {
        socket.join(roomId);

        const roomInfo = await getConsultingRoomInfo(roomId);
        socket.emit('joinedConsultingRoom', roomInfo);

        socket.to(roomId).emit('newUserJoined', { userName, message: '입장했습니다.' });
      } catch (error) {
        console.error('ConsultingRoom 입장 불가', error);
      }
    });

    socket.on('offer', ({ offer, roomId }) => {
      console.log('offer');
      socket.to(roomId).emit('offer', offer);
    });
    socket.on('answer', ({ answer, roomId }) => {
      console.log('answer');
      socket.to(roomId).emit('answer', answer);
    });
    socket.on('ice', ({ ice, roomId }) => {
      socket.to(roomId).emit('ice', ice);
    });
    socket.on('disconnecting', () => {
      const rooms = Array.from(socket.rooms);
      rooms.forEach(roomId => {
        performDisconnectingTask(socket, roomId)
          .then(() => {
            console.log('연결 해제 작업 완료');
          })
          .catch(error => {
            console.error('비동기 작업 중 오류 발생:', error);
          });
      });
    });

    socket.on('disconnect', socket => {
      console.log('소켓 연결 해제');
    });
    socket.on('leaveRoom', targetRoomId => {
      socket.leave(targetRoomId);
      socket.to(targetRoomId).emit('peerDisconnecting');
    });
  });
}

async function performDisconnectingTask(socket, targetRoomId) {
  return new Promise((resolve, reject) => {
    console.log('소켓 연결 해제 전 필요한 작업을 처리하는 함수');
    resolve();
  });
}

export default socketHandler;
