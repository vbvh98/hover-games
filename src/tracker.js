import * as handTrack from 'handtrackjs'
import { store } from './store'

const video = document.getElementById('vid')
const canvas = document.getElementById('vidc')
const context = canvas.getContext('2d')

const modelParams = {
  flipHorizontal: true,
  imageScaleFactor: 0.6,
  maxNumBoxes: 3,
  iouThreshold: 0.5,
  scoreThreshold: 0.7
}

let [distx, disty] = [null, null]
let [ox, oy] = [0, 0]
let gestRecorded = true

// let distOld = -1
// let dif = 0
// let gestureCount = 0

let model = null
handTrack.load(modelParams).then(lmodel => {
  // detect objects in the image.
  console.log('Loaded Model!')
  model = lmodel
  // startVideo();
  store.dispatch({ type: 'ready' })
})

export const startVideo = (getPos = false) => {
  handTrack.startVideo(video).then(function(status) {
    console.log('video started', status)
    if (status) {
      console.log('Video started. Now tracking')
      runDetection(getPos)
    } else {
      console.log('Please enable video')
    }
  })
}

// const getDirection = predictions => {
//   let direction = ''
//   const p1x1 = parseInt(predictions[0].bbox[0])
//   const p1y1 = parseInt(predictions[0].bbox[1])
//   const p1x2 = parseInt(predictions[0].bbox[2])
//   const p1y2 = parseInt(predictions[0].bbox[3])
//   const [x, y] = [(p1x1 + p1x2) / 2, (p1y1 + p1y2) / 2] //center points for the hand

//   if (gestRecorded) {
//     ox = x
//     oy = y
//     gestRecorded = false
//   } else {
//     distx = x - ox
//     disty = y - oy

//     if (Math.abs(distx) > 80 || Math.abs(disty) > 40) {
//       direction =
//         Math.abs(distx) > Math.abs(disty)
//           ? distx > 0 && Math.abs(distx) > 80
//             ? 'right'
//             : 'left'
//           : disty > 0 && Math.abs(disty) > 40
//           ? 'down'
//           : 'up'
//       if (direction !== '') gestRecorded = true
//     }
//   }
//   return direction
// }

// const getOpenClose = predictions => {
//   //start and end points for both hands are assigned here
//   const p1x1 = parseInt(predictions[0].bbox[0]);
//   const p1y1 = parseInt(predictions[0].bbox[1]);
//   const p1x2 = parseInt(predictions[0].bbox[2]);
//   const p1y2 = parseInt(predictions[0].bbox[3]);
//   const p2x1 = parseInt(predictions[1].bbox[0]);
//   const p2y1 = parseInt(predictions[1].bbox[1]);
//   const p2x2 = parseInt(predictions[1].bbox[2]);
//   const p2y2 = parseInt(predictions[1].bbox[3]);
//   //both hands center points
//   const [x1, y1] = [(p1x1 + p1x2) / 2, (p1y1 + p1y2) / 2];
//   const [x2, y2] = [(p2x1 + p2x2) / 2, (p2y1 + p2y2) / 2];
//   // distance between both hands
//   const dist = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
//   //debouncing for open and close gestures
//   if (gestureCount > 3 || gestureCount < -3) gestureCount = 0;
//   if (distOld === -1) {
//     //initiating for the first distance between hands
//     distOld = dist;
//     return;
//   }

//   //calculating new difference between the old and new distance between hands
//   dif = Math.abs(distOld - dist - dif) > 5 ? distOld - dist : dif;

//   let gesture = "NONE";

//   //if distance is changed by a threshold of 5, change the difference else keep it the same
//   if (dif === distOld - dist) {
//     //calculation for actual gestures open or close
//     gesture = dif > 0 ? "close" : "open";
//     if (gesture === "open") gestureCount++;
//     //incrementing for 3 consecutive open captures
//     else gestureCount--;
//     //decrementing for 3 consecutive close captures
//   }
//   //assigning the new distance to the old distance
//   distOld = dist;
//   // return gesture
//   if (gestureCount > 2) {
//     return "open";
//   } else if (gestureCount < -2) {
//     return "close";
//   }
// };

let [ex, ey] = [0, 0]

const getDirection = predictions => {
  // let direction = ''
  const p1x1 = parseInt(predictions[0].bbox[0])
  const p1y1 = parseInt(predictions[0].bbox[1])
  const p1x2 = parseInt(predictions[0].bbox[2])
  const p1y2 = parseInt(predictions[0].bbox[3])
  const [x, y] = [(p1x1 + p1x2) / 2, (p1y1 + p1y2) / 2] //center points for the hand

  if (gestRecorded) {
    ;[ox, oy] = [x, y]
    gestRecorded = false
  } else {
    ;[ex, ey] = [x, y]
  }
  // return direction
}

async function runDetection(getPos) {
  await model.detect(video).then(predictions => {
    let dir = ''
    if (predictions.length === 0) {
      ;[distx, disty] = [ox - ex, oy - ey]
      //      const slope = Math.abs(disty) / Math.abs(distx)
      let [thresholdX, thresholdY] = [
        Math.abs(distx) - 100,
        Math.abs(disty) - 200 / 3
      ]

      if (thresholdX > 0 && thresholdY <= 0) {
        //register horizontal
        dir = distx > 0 ? 'right' : 'left'
      } else if (thresholdY > 0 && thresholdX <= 0) {
        //register vertical
        dir = disty > 0 ? 'down' : 'up'
      } else if (thresholdX > 0 && thresholdY > 0) {
        //assert direction according to factor increase
        dir =
          Math.abs(disty) / Math.abs(distx) > 2 / 3
            ? disty > 0
              ? 'down'
              : 'up'
            : distx > 0
            ? 'right'
            : 'left'
      }

      if (dir !== '') {
        gestRecorded = true
        store.dispatch({ type: dir })
      }
    } else if (predictions.length > 0) {
      getDirection(predictions)
      model.renderPredictions(predictions, canvas, context, video)
    }
    requestAnimationFrame(runDetection)
  })
}

export function stop() {
  handTrack.stopVideo()
}
