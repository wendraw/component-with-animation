export class Timeline {
  constructor() {
    this.animations = [];
    this.requestID = null;
    this.state = "initialed";
  }

  tick() {
    let t = Date.now() - this.startTime;
    let animations = this.animations.filter((anim) => !anim.isFinished);
    for (let animation of animations) {
      let { object, property, template, duration, delay, timingFunction, addStartTime } = animation;

      let time = (t - delay - addStartTime) / duration;
      let progression = timingFunction(time); // 0 ~ 1 之间的一个数
      if (t - delay - addStartTime > duration) {
        progression = 1;
        animation.isFinished = true;
      }

      let value = animation.valueFromProgression(progression);

      object[property] = template(value);
    }
    if (animations.length) {
      this.requestID = requestAnimationFrame(() => this.tick());
    }
  }

  add(animation, addStartTime) {
    animation.isFinished = false;

    if (this.state === "playing") {
      animation.addStartTime = addStartTime !== void 0 ? addStartTime : Date.now() - this.startTime;
    } else {
      animation.addStartTime = addStartTime !== void 0 ? addStartTime : 0;
    }

    this.animations.push(animation);
  }

  start() {
    if (this.state !== "initialed") return;
    this.state = "playing";
    this.startTime = Date.now();
    this.tick();
  }

  pause() {
    if (this.state !== "playing") return;
    this.state = "paused";
    this.pauseTime = Date.now();
    if (this.requestID !== null) {
      cancelAnimationFrame(this.requestID);
    }
  }

  resume() {
    if (this.state !== "paused") return;
    this.state = "playing";
    this.startTime += Date.now() - this.pauseTime;
    this.tick();
  }

  restart() {
    if (this.state === "playing") {
      this.pause();
    }
    this.animations.forEach((anim) => {
      anim.isFinished = false;
    });
    this.state = "playing";
    this.requestID = null;
    this.startTime = Date.now();
    this.pauseTime = 0;
    this.tick();
  }
}

export class Animation {
  constructor(option) {
    let { object, property, template, start, end, duration, delay, timingFunction } = option;
    this.object = object;
    this.property = property;
    this.template = template;
    this.start = start;
    this.end = end;
    this.duration = duration;
    this.delay = delay || 0;
    this.timingFunction = timingFunction;
  }

  valueFromProgression(progression) {
    return this.start + progression * (this.end - this.start);
  }
}

export class RGBAAnimation extends Animation {
  constructor(option) {
    super(option);
    let { template } = option;
    this.template = template || ((v) => `rgba(${v.r}, ${v.g}, ${v.b}, ${v.a})`);
  }

  valueFromProgression(progression) {
    return {
      r: this.start.r + progression * (this.end.r - this.start.r),
      g: this.start.g + progression * (this.end.g - this.start.g),
      b: this.start.b + progression * (this.end.b - this.start.b),
      a: this.start.a + progression * (this.end.a - this.start.a),
    };
  }
}
