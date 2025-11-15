import { aviatorAudio } from '@/modules/aviator/config/sceneConfig';

type Sample = 'click' | 'win' | 'lose';

export class AviatorAudioEngine {
  private readonly music?: HTMLAudioElement;
  private readonly samples: Partial<Record<Sample, HTMLAudioElement>> = {};

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    this.music = this.createAudio(aviatorAudio.music, { loop: true, volume: 0.35 });
    this.samples.click = this.createAudio(aviatorAudio.click, { volume: 0.7 });
    this.samples.win = this.createAudio(aviatorAudio.win, { volume: 0.8 });
    this.samples.lose = this.createAudio(aviatorAudio.lose, { volume: 0.8 });
  }

  toggleMusic(enabled: boolean) {
    if (!this.music) {
      return;
    }

    if (enabled) {
      void this.music.play().catch(() => {
        // Playback may fail if the user has not interacted yet.
      });
    } else {
      this.music.pause();
      this.music.currentTime = 0;
    }
  }

  play(sample: Sample) {
    const audio = this.samples[sample];
    if (!audio) {
      return;
    }
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Ignore autoplay restrictions.
    });
  }

  private createAudio(src: string, options?: { loop?: boolean; volume?: number }) {
    const audio = new Audio(src);
    audio.loop = options?.loop ?? false;
    audio.volume = options?.volume ?? 1;
    return audio;
  }
}
