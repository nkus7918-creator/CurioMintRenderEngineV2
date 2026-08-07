import type {
    LayoutPreset,
  } from "../types";
  
  export type DocumentarySafeAreaName =
    | "frame"
    | "title"
    | "content"
    | "card"
    | "subtitle"
    | "lowerThird"
    | "citation"
    | "chapter";
  
  export const DOCUMENTARY_LAYOUT_PRESET = {
    name:
      "documentary-16x9",
  
    designWidth: 1920,
  
    designHeight: 1080,
  
    columns: 12,
  
    gutter: 24,
  
    safeAreas: {
      /*
       * Genel ekran güvenliği.
       */
      frame: {
        top: 54,
        right: 96,
        bottom: 54,
        left: 96,
      },
  
      /*
       * Section title alanı.
       */
      title: {
        top: 48,
        right: 96,
        bottom: 782,
        left: 96,
      },
  
      /*
       * Genel içerik alanı.
       */
      content: {
        top: 96,
        right: 96,
        bottom: 120,
        left: 96,
      },
  
      /*
       * Infographic ve bilgi kartları.
       * Title ve subtitle bölgelerine girmez.
       */
      card: {
        top: 140,
        right: 96,
        bottom: 260,
        left: 96,
      },
  
      /*
       * Sinematik subtitle bölgesi.
       */
      subtitle: {
        top: 820,
        right: 96,
        bottom: 46,
        left: 96,
      },
  
      /*
       * İleride eklenecek Lower Third.
       */
      lowerThird: {
        top: 700,
        right: 96,
        bottom: 180,
        left: 96,
      },
  
      /*
       * İleride eklenecek Source Citation.
       */
      citation: {
        top: 930,
        right: 96,
        bottom: 30,
        left: 96,
      },
  
      /*
       * Chapter Intro ana içerik bölgesi.
       */
      chapter: {
        top: 80,
        right: 120,
        bottom: 80,
        left: 120,
      },
    },
  } as const satisfies LayoutPreset;