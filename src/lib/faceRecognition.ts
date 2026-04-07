'use client';

import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  
  const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
  
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log('Face API models loaded');
  } catch (error) {
    console.error('Failed to load face-api.js models:', error);
    throw error;
  }
}

export async function detectFaceDescriptor(imageElement: HTMLImageElement | HTMLVideoElement): Promise<number[] | null> {
  try {
    await loadModels();
    
    const detection = await faceapi
      .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();
    
    if (!detection) {
      return null;
    }
    
    return Array.from((detection as any).descriptor);
  } catch (error) {
    console.error('Face detection error:', error);
    return null;
  }
}

export async function detectFaceFromCanvas(canvas: HTMLCanvasElement): Promise<number[] | null> {
  try {
    await loadModels();
    
    const detection = await faceapi
      .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();
    
    if (!detection) {
      return null;
    }
    
    return Array.from((detection as any).descriptor);
  } catch (error) {
    console.error('Face detection error:', error);
    return null;
  }
}

export function compareDescriptors(desc1: number[], desc2: number[]): number {
  if (desc1.length !== desc2.length) {
    throw new Error('Descriptor lengths do not match');
  }
  
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
}

export function areFacesMatching(desc1: number[], desc2: number[], threshold: number = 0.6): boolean {
  const distance = compareDescriptors(desc1, desc2);
  return distance < threshold;
}