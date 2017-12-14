class VCO {
  constructor(context, type = 'sine') {
    this.context = context;

    this.osc = context.createOscillator();
    this.osc.type = type;
    this.setFrequency(440);
    this.osc.start(0);

    this.input = this.osc;
    this.output = this.osc;
  }

  setType(type) {
    this.osc.type = type;
  }

  setFrequency(freq) {
    this.osc.frequency.setValueAtTime(freq, this.context.currentTime);
  }

  connect(node) {
    if (node.input) {
      this.output.connect(node.input);
    } else {
      this.output.connect(node);
    }
  }
}

class Envelope {
  constructor(context, attack = 0.1, release = 0.5) {
    this.context = context;
    this.attackTime = attack;
    this.releaseTime = release;
  }

  trigger() {
    const now = this.context.currentTime;
    const t1 = now + this.attackTime;
    const t2 = now + this.attackTime + this.releaseTime;

    this.param.cancelScheduledValues(now);
    this.param.setValueAtTime(0, now);
    this.param.linearRampToValueAtTime(1, t1);
    this.param.linearRampToValueAtTime(0, t2);
  }

  connect(param) {
    this.param = param;
  }
}

class VCA {
  constructor(context) {
    this.gain = context.createGain();
    this.gain.gain.value = 0;

    this.input = this.gain;
    this.output = this.gain;

    this.amplitude = this.gain.gain;
  }

  connect(node) {
    if (node.input) {
      this.output.connect(node.input);
    } else {
      this.output.connect(node);
    }
  }
}

class Tone {
  constructor(context) {
    this.vco = new VCO(context, 'sine');
    this.envelope = new Envelope(context, 0.05, 0.3);
    this.vca = new VCA(context);

    this.input = this.vco;
    this.output = this.vca;

    this.vco.connect(this.vca);
    this.envelope.connect(this.vca.amplitude);
  }

  play(frequency) {
    this.vco.setFrequency(frequency);
    this.envelope.trigger();
  }

  connect(node) {
    if (node.input) {
      this.output.connect(node.input);
    } else {
      this.output.connect(node);
    }
  }
}

class Scale {
  constructor(base, steps) {
    this.base = base;
    this.steps = steps;
  }

  stepToFrequency(step) {
    return this.base * (2 ** (1 / 12)) ** step;
  }

  getRandomFrequency() {
    const step = this.steps[~~(Math.random() * this.steps.length)];
    return this.stepToFrequency(step);
  }

  getChord() {
    return [
      this.steps[0],
      this.steps[2],
      this.steps[4],
      this.steps[6]
    ].map(step => this.stepToFrequency(step));
  }

  shift() {
    this.base = this.stepToFrequency(5);
    if (this.base > 440) this.base /= 2;
  }
}

class Boop {
  constructor(context, scale) {
    this.scale = scale;
    this.tone = new Tone(context);

    this.input = this.tone;
    this.output = this.tone;
  }

  trigger() {
    this.tone.play(this.scale.getRandomFrequency());
  }

  connect(node) {
    if (node.input) {
      this.output.connect(node.input);
    } else {
      this.output.connect(node);
    }
  }
}

class Ding {
  constructor(context, scale) {
    this.scale = scale;

    this.tones = [];
    this.gain = context.createGain();

    this.scale.getChord().forEach(() => {
      const tone = new Tone(context);
      tone.connect(this.gain);
      this.tones.push(tone);
    });

    this.input = null;
    this.output = this.gain;
  }

  trigger() {
    this.scale.getChord().forEach((frequency, i) => {
      this.tones[i].play(frequency);
    });
  }

  connect(node) {
    if (node.input) {
      this.output.connect(node.input);
    } else {
      this.output.connect(node);
    }
  }
}

export default class SoundBoi {
  constructor() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();

    this.scale = new Scale(Math.random() * 220 + 220, [0, 2, 4, 5, 7, 9, 11]);

    this.boop = new Boop(this.context, this.scale);
    this.boop.connect(this.context.destination);

    this.ding = new Ding(this.context, this.scale);
    this.ding.connect(this.context.destination);
  }

  boopMe() {
    this.boop.trigger();
  }

  dingMe() {
    this.ding.trigger();
  }

  shift() {
    this.scale.shift();
  }
}