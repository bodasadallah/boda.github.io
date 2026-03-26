---
title: TTS Research
date: '2021-10-14'
slug: tts-research-2021
summary: A summary research for TTS
short_title: TTS Research
thumbnail: /blogs/images/generated/text_to_speech.png
draft: false
---

### TTS

TTS can be viewed as a sequence-to-sequence mapping problem; from a sequence of discrete symbols
(text) to a real-valued time series (speech signals). A typical TTS pipeline has two parts; 1)
text analysis and 2) speech synthesis. The text analysis part typically includes a number of natural
language processing (NLP) steps, such as sentence segmentation, word segmentation, text normalization,
part-of-speech (POS) tagging, and grapheme-to-phoneme (G2P) conversion. It takes a word
sequence as input and outputs a phoneme sequence with a variety of linguistic contexts. The speech
synthesis part takes the context-dependent phoneme sequence as its input and outputs a synthesized
speech waveform.

## End-to-end TTS

- easier pipeline
- better peformance

## Wavenet

### Based on:

- [DeepMind's Wavenet](https://www.youtube.com/watch?v=YyUXG-BfDbE)
- https://www.kdnuggets.com/2020/07/deep-learning-signal-processing.html
- https://deepmind.com/blog/article/wavenet-generative-model-raw-audio

### Wavenet V1

before wavenet, ther was two methods:

- generative method, which would produce the over all song of the sentece well, but would fail to produce the individual sounds well
- concatinative: we use a huge corpus of phonatics and concatinate them together to procude a whole sentence, this way we would procuce the individual sounds correctly, but we would lose the song of the sentence

- wavenet: tries to do both of the above methods, it also can change the speaker by changing some parameters

- data output: 16 khz rate
- we cant use normal RNN as the max seq length around 50

- they used dilated CNNs:
  - can have very long look back
  - fast to train

This paper has presented WaveNet, a deep generative model of audio data that operates directly at
the waveform level. WaveNets are autoregressive and combine causal filters with dilated convolutions
to allow their receptive fields to grow exponentially with depth, which is important to model
the long-range temporal dependencies in audio signals. We have shown how WaveNets can be conditioned
on other inputs in a global (e.g. speaker identity) or local way (e.g. linguistic features).
When applied to TTS, WaveNets produced samples that outperform the current best TTS systems
in subjective naturalness. Finally, WaveNets showed very promising results when applied to music
audio modeling and speech recognition.

### Wavenet V2

The original Wavenet implementation suffered from low speed inference, because it predicts samples squentially.
They needed to predict time samples in prallel so that wavenet can be used in production, so the used a fully trained wavenet teacher, to train a smaller wavnet student, which doesn't depend on previous samples to produce the current sample, while still maintaining the same quality

## End-to-end adversarial TTS

### Based on:

- https://www.youtube.com/watch?v=WTB2p4bqtXU
- https://deepmind.com/research/publications/2020/End-to-End-Adversarial-Text-to-Speech
- https://arxiv.org/abs/2006.03575

Adversarial: means we have a generator and a descriminator which tries to detect which output is generated and which is real
End-to-end : they take in text and output the speech

steps:

- we enter the text, then we tokenize it
- then we use a stack of dilated conv layers to predict the length of each token
- with this info, we can predict the center of each token
- then we use a gaussian kernel to give a prob distributaion for the place of the token center
- then the generator can generate the sound

\*\* Q: here we assumed that every token starts directly after the one before it, but is that the case? don't we need to add a small duration of no sound between tokens?

## Tacotron2

### based on:

- [paper](https://arxiv.org/pdf/1712.05884v2.pdf)
- [repo](https://github.com/NVIDIA/tacotron2)

you train tacotron-like seq2seq model to output a mel spectrogram, then pass that to wavenet to generate the wave form

This paper describes Tacotron 2, a fully neural TTS system that
combines a sequence-to-sequence recurrent network with attention to
predicts mel spectrograms with a modified WaveNet vocoder. The
resulting system synthesizes speech with Tacotron-level prosody and
WaveNet-level audio quality. This system can be trained directly from
data without relying on complex feature engineering, and achieves
state-of-the-art sound quality close to that of natural human speech.

## Common TTS Architictures:

        - Autoregressive models
        - DCCN
        - Flow
        - Teacher Student
        - Variational auto encoders (VAE)
        - GANS


# Resources

- https://towardsdatascience.com/state-of-the-art-of-speech-synthesis-at-the-end-of-may-2021-6ace4fd512f2

```python

```
