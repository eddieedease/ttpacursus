import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, RouterLink],
  template: `
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-slate-900 text-white py-24 sm:py-32 px-4 sm:px-6">
      <img
        ngSrc="images/simulatie.jpg"
        fill
        priority
        alt=""
        class="object-cover"
      >
      <div class="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-teal-950/75" aria-hidden="true"></div>
      <div class="relative max-w-4xl mx-auto text-center">
        <span class="inline-block bg-teal-500/25 text-teal-200 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-6 border border-teal-500/30">
          Cursus aanmelding
        </span>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
          TTPA Cursus<br>
          <span class="text-teal-400">voor medisch professionals</span>
        </h1>
        <p class="text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto mb-10 leading-relaxed">
          Meld u aan voor de TTPA Cursus. Een opleiding speciaal ontwikkeld voor medische specialisten en zorgprofessionals.
          Vergroot uw kennis en vaardigheden in een intensieve, praktijkgerichte omgeving.
        </p>
        <a
          routerLink="/aanmelden"
          id="cta-aanmelden"
          class="inline-block bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-base px-8 py-4 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-teal-500/25 hover:shadow-xl"
        >
          Nu aanmelden &rarr;
        </a>
      </div>
    </section>

    <!-- About -->
    <section class="bg-slate-50 py-16 sm:py-20 px-4 sm:px-6" aria-labelledby="about-heading">
      <div class="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div>
          <h2 id="about-heading" class="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Over de cursus</h2>
          <p class="text-slate-700 leading-relaxed mb-4">
            In de TTPA cursus (Tips, Tricks and Pitfall Avoidance) oefent u met realistische scenario's
            in een gesimuleerde zorgomgeving. U leert valkuilen herkennen voordat ze in de praktijk optreden.
          </p>
          <ul class="space-y-3 list-none p-0 m-0">
            @for (item of focus; track item.title) {
              <li class="flex gap-3">
                <span class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </span>
                <span class="text-slate-700"><strong class="text-slate-900">{{ item.title }}</strong> — {{ item.text }}</span>
              </li>
            }
          </ul>
        </div>
        <div class="relative">
          <img
            ngSrc="images/training-illustratie.jpg"
            width="1200"
            height="669"
            alt="Illustratie van een trainingssituatie: een zorgteam werkt rond een patiëntbed volgens ABCDE en SBAR, met een trainer die meekijkt."
            class="w-full h-auto rounded-2xl shadow-xl ring-1 ring-slate-900/10"
          >
        </div>
      </div>
    </section>

    <!-- Course info cards -->
    <section class="bg-white py-16 px-4 sm:px-6" aria-labelledby="info-heading">
      <div class="max-w-5xl mx-auto">
        <h2 id="info-heading" class="text-2xl font-bold text-slate-800 text-center mb-10">Cursusinformatie</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
            <div class="text-teal-500 mb-3" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Datum</p>
            <p class="text-slate-800 font-semibold">Nader te bepalen</p>
          </div>

          <div class="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
            <div class="text-teal-500 mb-3" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Locatie</p>
            <p class="text-slate-800 font-semibold">Nader te bepalen</p>
          </div>

          <div class="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
            <div class="text-teal-500 mb-3" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Duur</p>
            <p class="text-slate-800 font-semibold">Nader te bepalen</p>
          </div>

          <div class="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
            <div class="text-teal-500 mb-3" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
            </div>
            <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Accreditatie</p>
            <p class="text-slate-800 font-semibold">Aangevraagd</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Banner -->
    <section class="bg-teal-600 py-14 px-4 sm:px-6 text-center">
      <h2 class="text-2xl sm:text-3xl font-bold text-white mb-4">Klaar om u aan te melden?</h2>
      <p class="text-teal-100 mb-8 max-w-xl mx-auto">
        Vul het aanmeldformulier in en reserveer uw plek voor de TTPA Cursus. Plaatsen zijn beperkt.
      </p>
      <a
        routerLink="/aanmelden"
        id="cta-aanmelden-bottom"
        class="inline-block bg-white text-teal-700 hover:bg-teal-50 font-bold px-8 py-4 rounded-xl shadow transition-all duration-200 hover:scale-105"
      >
        Aanmeldformulier invullen
      </a>
    </section>
  `,
})
export class LandingComponent {
  readonly focus = [
    { title: 'Praktijkgericht', text: 'oefenen met scenario’s en simulatiemateriaal.' },
    { title: 'Gestructureerd werken', text: 'volgens de ABCDE-methodiek en SBAR-overdracht.' },
    { title: 'Samenwerken', text: 'teamwork en communicatie onder druk (CRM).' },
  ];
}
