AFRAME.registerComponent("gesture-handler", {
  schema: {
    enabled: { default: true },
    movementFactorH: { default: 0.5 },
    movementFactorV: { default: 0.25 },
    zoomFactor: { default: 4 },
    minZoom: { default: 0.5 }, // Minimum zoom level
    maxZoom: { default: 2.5 },   // Maximum zoom level
    handleZoom: { default: true },
    handleMovementHor: { default: true },
    handleMovementVert: { default: true },
  },

  init: function () {
    this.handleZoom = this.handleZoom.bind(this);
    this.handleMovementHor = this.handleMovementHor.bind(this);
    this.handleMovementVert = this.handleMovementVert.bind(this);

    this.isVisible = false;
    this.initialPosition = this.el.object3D.position.clone();

    this.el.sceneEl.addEventListener("markerFound", (e) => {
      this.isVisible = true;
    });

    this.el.sceneEl.addEventListener("markerLost", (e) => {
      this.isVisible = false;
    });
  },

  update: function () {
    if (this.data.enabled) {
      if (this.data.handleMovementHor) {
        this.el.sceneEl.addEventListener("onefingermove", this.handleMovementHor);
      } else {
        this.el.sceneEl.removeEventListener("onefingermove", this.handleMovementHor);
      }
      
      if (this.data.handleMovementVert) {
        this.el.sceneEl.addEventListener("onefingermove", this.handleMovementVert);
      } else {
        this.el.sceneEl.removeEventListener("onefingermove", this.handleMovementVert);
      }
      
      if (this.data.handleZoom) {
        this.el.sceneEl.addEventListener("twofingermove", this.handleZoom);
      } else {
        this.el.sceneEl.removeEventListener("twofingermove", this.handleZoom);
      }
    }
  },

  remove: function () {
    this.el.sceneEl.removeEventListener("onefingermove", this.handleMovementHor);
    this.el.sceneEl.removeEventListener("onefingermove", this.handleMovementVert);
    this.el.sceneEl.removeEventListener("twofingermove", this.handleZoom);
  },

  handleMovementHor: function (event) {
    this.el.object3D.position.x -=
      event.detail.positionChange.x * this.data.movementFactorH / this.el.object3DMap.camera.zoom;
  },

  handleMovementVert: function (event) {
    this.el.object3D.position.y +=
      event.detail.positionChange.y * this.data.movementFactorV / this.el.object3DMap.camera.zoom;
    this.el.object3D.position.z -=
      event.detail.positionChange.y * this.data.movementFactorV / this.el.object3DMap.camera.zoom;
  },
    
  handleZoom: function (event) {
    const camera = this.el.object3DMap.camera;
    const zoomChange = -event.detail.spreadChange * this.data.zoomFactor; // Reverse the zoom change
    const newZoom = camera.zoom - zoomChange;
  
    // Enforce zoom limits defined in schema.
    const minZoom = this.data.minZoom;
    const maxZoom = this.data.maxZoom;
    camera.zoom = Math.min(maxZoom, Math.max(minZoom, newZoom));
  
    camera.updateProjectionMatrix(); // Update the projection matrix
    console.log(camera.zoom);
  }
  // handleZoom: function (event) {
  //   this.el.object3D.position.y -= event.detail.spreadChange * this.data.zoomFactor;
  //   this.el.object3D.position.z -= event.detail.spreadChange * this.data.zoomFactor;
  // }
});

// Component that detects and emits events for touch gestures

AFRAME.registerComponent("gesture-detector", {
schema: {
  element: { default: "" }
},

init: function() {
  this.targetElement =
    this.data.element && document.querySelector(this.data.element);

  if (!this.targetElement) {
    this.targetElement = this.el;
  }

  this.internalState = {
    previousState: null
  };

  this.emitGestureEvent = this.emitGestureEvent.bind(this);

  this.targetElement.addEventListener("touchstart", this.emitGestureEvent);

  this.targetElement.addEventListener("touchend", this.emitGestureEvent);

  this.targetElement.addEventListener("touchmove", this.emitGestureEvent);
},

remove: function() {
  this.targetElement.removeEventListener("touchstart", this.emitGestureEvent);

  this.targetElement.removeEventListener("touchend", this.emitGestureEvent);

  this.targetElement.removeEventListener("touchmove", this.emitGestureEvent);
},

emitGestureEvent(event) {
  const currentState = this.getTouchState(event);

  const previousState = this.internalState.previousState;

  const gestureContinues =
    previousState &&
    currentState &&
    currentState.touchCount == previousState.touchCount;

  const gestureEnded = previousState && !gestureContinues;

  const gestureStarted = currentState && !gestureContinues;

  if (gestureEnded) {
    const eventName =
      this.getEventPrefix(previousState.touchCount) + "fingerend";

    this.el.emit(eventName, previousState);

    this.internalState.previousState = null;
  }

  if (gestureStarted) {
    currentState.startTime = performance.now();

    currentState.startPosition = currentState.position;

    currentState.startSpread = currentState.spread;

    const eventName =
      this.getEventPrefix(currentState.touchCount) + "fingerstart";

    this.el.emit(eventName, currentState);

    this.internalState.previousState = currentState;
  }

  if (gestureContinues) {
    const eventDetail = {
      positionChange: {
        x: currentState.position.x - previousState.position.x,

        y: currentState.position.y - previousState.position.y
      }
    };

    if (currentState.spread) {
      eventDetail.spreadChange = currentState.spread - previousState.spread;
    }

    // Update state with new data

    Object.assign(previousState, currentState);

    // Add state data to event detail

    Object.assign(eventDetail, previousState);

    const eventName =
      this.getEventPrefix(currentState.touchCount) + "fingermove";

    this.el.emit(eventName, eventDetail);
  }
},

getTouchState: function(event) {
  if (event.touches.length === 0) {
    return null;
  }

  // Convert event.touches to an array so we can use reduce

  const touchList = [];

  for (let i = 0; i < event.touches.length; i++) {
    touchList.push(event.touches[i]);
  }

  const touchState = {
    touchCount: touchList.length
  };

  // Calculate center of all current touches

  const centerPositionRawX =
    touchList.reduce((sum, touch) => sum + touch.clientX, 0) /
    touchList.length;

  const centerPositionRawY =
    touchList.reduce((sum, touch) => sum + touch.clientY, 0) /
    touchList.length;

  touchState.positionRaw = { x: centerPositionRawX, y: centerPositionRawY };

  // Scale touch position and spread by average of window dimensions

  const screenScale = 2 / (window.innerWidth + window.innerHeight);

  touchState.position = {
    x: centerPositionRawX * screenScale,
    y: centerPositionRawY * screenScale
  };

  // Calculate average spread of touches from the center point

  if (touchList.length >= 2) {
    const spread =
      touchList.reduce((sum, touch) => {
        return (
          sum +
          Math.sqrt(
            Math.pow(centerPositionRawX - touch.clientX, 2) +
              Math.pow(centerPositionRawY - touch.clientY, 2)
          )
        );
      }, 0) / touchList.length;

    touchState.spread = spread * screenScale;
  }

  return touchState;
},

getEventPrefix(touchCount) {
  const numberNames = ["one", "two", "three", "many"];

  return numberNames[Math.min(touchCount, 4) - 1];
}
});
