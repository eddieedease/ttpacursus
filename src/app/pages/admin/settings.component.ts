import { ChangeDetectionStrategy, Component, WritableSignal, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SiteService } from '../../services/site.service';
import { SettingsService } from '../../services/settings.service';
import { apiError } from '../../shared/api-error';

type Message = { ok: boolean; text: string } | null;

@Component({
  selector: 'app-admin-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- Under construction -->
      <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 self-start" aria-labelledby="construction-heading">
        <h2 id="construction-heading" class="text-base font-semibold text-slate-800 mb-1">Site in aanbouw</h2>
        <p class="text-sm text-slate-600 mb-5">
          Zolang dit aan staat zien bezoekers een "binnenkort online"-pagina en kunnen ze de site alleen bekijken
          met het preview-wachtwoord. Het beheer (/admin) en de trainerspagina (/trainer) blijven altijd bereikbaar.
        </p>
        <p class="text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
          Ingelogd als beheerder ziet u de site altijd. Controleer het slot in een <strong>privévenster</strong>.
          Bij het opnieuw aanzetten moet iedereen het preview-wachtwoord opnieuw invoeren.
        </p>
        <form [formGroup]="construction" (ngSubmit)="saveConstruction()" novalidate class="space-y-4">
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" formControlName="constructionEnabled" class="h-5 w-5 rounded border-slate-400 text-teal-600 focus:ring-teal-500">
            <span class="text-sm font-medium text-slate-800">Site staat in aanbouw (uitzetten zodra de site live gaat)</span>
          </label>
          <div>
            <label for="s-cpw" class="form-label">Preview-wachtwoord</label>
            <input id="s-cpw" type="text" formControlName="constructionPassword" class="form-input" autocomplete="off">
          </div>
          @if (constructionMsg(); as m) {
            <p class="text-sm" [class]="m.ok ? 'text-teal-800' : 'text-red-700'" role="status">{{ m.text }}</p>
          }
          <button type="submit" [disabled]="busy()" class="btn-primary">Opslaan</button>
        </form>
      </section>

      <!-- Mail -->
      <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 self-start" aria-labelledby="mail-heading">
        <h2 id="mail-heading" class="text-base font-semibold text-slate-800 mb-1">E-mail verzenden</h2>
        <p class="text-sm text-slate-600 mb-5">
          De SMTP-gegevens vindt u in het controlepaneel van uw hostingprovider bij het e-mailaccount.
        </p>
        <form [formGroup]="mail" (ngSubmit)="saveMail()" novalidate class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="s-from" class="form-label">Afzenderadres</label>
              <input id="s-from" type="email" formControlName="mailFromAddress" class="form-input" placeholder="info@uw-domein.nl">
            </div>
            <div>
              <label for="s-fromname" class="form-label">Afzendernaam</label>
              <input id="s-fromname" type="text" formControlName="mailFromName" class="form-input">
            </div>
          </div>
          <div>
            <label for="s-bcc" class="form-label">Kopie (BCC) van alle mails naar</label>
            <input id="s-bcc" type="text" formControlName="mailBcc" class="form-input" placeholder="optioneel, meerdere adressen met komma" aria-describedby="s-bcc-hint">
            <p id="s-bcc-hint" class="mt-1 text-xs text-slate-600">Handig om als beheer mee te lezen met wat deelnemers ontvangen.</p>
          </div>
          <div>
            <label for="s-transport" class="form-label">Verzendmethode</label>
            <select id="s-transport" formControlName="mailTransport" class="form-input">
              <option value="smtp">SMTP (aanbevolen)</option>
              <option value="mail">PHP mail()</option>
            </select>
          </div>
          @if (mail.controls.mailTransport.value === 'smtp') {
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="sm:col-span-2">
                <label for="s-host" class="form-label">SMTP-server</label>
                <input id="s-host" type="text" formControlName="smtpHost" class="form-input" placeholder="mail.uw-domein.nl">
              </div>
              <div>
                <label for="s-port" class="form-label">Poort</label>
                <input id="s-port" type="text" inputmode="numeric" formControlName="smtpPort" class="form-input">
              </div>
            </div>
            <div>
              <label for="s-secure" class="form-label">Beveiliging</label>
              <select id="s-secure" formControlName="smtpSecure" class="form-input">
                <option value="tls">STARTTLS (meestal poort 587)</option>
                <option value="ssl">SSL/TLS (meestal poort 465)</option>
                <option value="none">Geen</option>
              </select>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="s-user" class="form-label">Gebruikersnaam</label>
                <input id="s-user" type="text" formControlName="smtpUser" class="form-input" autocomplete="off">
              </div>
              <div>
                <label for="s-pass" class="form-label">Wachtwoord</label>
                <input id="s-pass" type="password" formControlName="smtpPass" class="form-input" autocomplete="new-password"
                       [placeholder]="smtpPassSet() ? '•••••• (ongewijzigd)' : ''">
              </div>
            </div>
          }
          @if (mailMsg(); as m) {
            <p class="text-sm" [class]="m.ok ? 'text-teal-800' : 'text-red-700'" role="status">{{ m.text }}</p>
          }
          <button type="submit" [disabled]="busy()" class="btn-primary">Opslaan</button>
        </form>

        <div class="border-t border-slate-200 mt-6 pt-5">
          <label for="s-test" class="form-label">Testmail versturen naar</label>
          <div class="flex gap-2">
            <input id="s-test" type="email" class="form-input" [value]="testTo()" (input)="onTestTo($event)" autocomplete="email">
            <button type="button" [disabled]="busy()" (click)="sendTest()"
              class="shrink-0 text-sm font-semibold text-teal-800 border border-teal-400 hover:bg-teal-50 px-4 rounded-lg disabled:opacity-50">
              Verstuur
            </button>
          </div>
          @if (testMsg(); as m) {
            <p class="mt-2 text-sm" [class]="m.ok ? 'text-teal-800' : 'text-red-700'" role="status">{{ m.text }}</p>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    @reference "tailwindcss";
    .form-label { @apply block text-sm font-medium text-slate-700 mb-1; }
    .form-input {
      @apply w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm
             focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors;
    }
    .btn-primary {
      @apply bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors;
    }
  `],
})
export class AdminSettingsComponent {
  private readonly settingsService = inject(SettingsService);
  private readonly site = inject(SiteService);
  private readonly fb = new FormBuilder().nonNullable;

  readonly busy = signal(false);
  readonly smtpPassSet = signal(false);
  readonly testTo = signal('');
  readonly constructionMsg = signal<Message>(null);
  readonly mailMsg = signal<Message>(null);
  readonly testMsg = signal<Message>(null);

  readonly construction = this.fb.group({
    constructionEnabled: [true],
    constructionPassword: ['', Validators.required],
  });

  readonly mail = this.fb.group({
    mailFromAddress: [''],
    mailFromName: [''],
    mailBcc: [''],
    mailTransport: ['smtp' as 'smtp' | 'mail'],
    smtpHost: [''],
    smtpPort: [''],
    smtpSecure: ['tls' as 'ssl' | 'tls' | 'none'],
    smtpUser: [''],
    smtpPass: [''],
  });

  constructor() {
    this.load();
  }

  private async load(): Promise<void> {
    try {
      const s = await this.settingsService.get();
      this.construction.setValue({ constructionEnabled: s.constructionEnabled, constructionPassword: s.constructionPassword });
      this.mail.setValue({
        mailFromAddress: s.mailFromAddress, mailFromName: s.mailFromName, mailBcc: s.mailBcc,
        mailTransport: s.mailTransport, smtpHost: s.smtpHost, smtpPort: s.smtpPort, smtpSecure: s.smtpSecure,
        smtpUser: s.smtpUser, smtpPass: '',
      });
      this.smtpPassSet.set(s.smtpPassSet);
    } catch {
      this.constructionMsg.set({ ok: false, text: 'Instellingen konden niet worden geladen.' });
    }
  }

  onTestTo(event: Event): void {
    this.testTo.set((event.target as HTMLInputElement).value);
  }

  async saveConstruction(): Promise<void> {
    await this.run(this.constructionMsg, async () => {
      await this.settingsService.save(this.construction.getRawValue());
      await this.site.load(true);
      return this.construction.controls.constructionEnabled.value
        ? 'Opgeslagen. De site staat in aanbouw.'
        : 'Opgeslagen. De site is nu openbaar.';
    }, 'De instellingen konden niet worden opgeslagen.');
  }

  async saveMail(): Promise<void> {
    await this.run(this.mailMsg, async () => {
      await this.settingsService.save(this.mail.getRawValue());
      if (this.mail.controls.smtpPass.value) {
        this.smtpPassSet.set(true);
        this.mail.controls.smtpPass.setValue('');
      }
      return 'Mailinstellingen opgeslagen.';
    }, 'De mailinstellingen konden niet worden opgeslagen.');
  }

  async sendTest(): Promise<void> {
    await this.run(this.testMsg, async () => {
      await this.settingsService.sendTestMail(this.testTo());
      return `Testmail verstuurd naar ${this.testTo()}.`;
    }, 'De testmail kon niet worden verstuurd.');
  }

  private async run(target: WritableSignal<Message>, action: () => Promise<string>, fallback: string): Promise<void> {
    this.busy.set(true);
    try {
      target.set({ ok: true, text: await action() });
    } catch (e) {
      target.set({ ok: false, text: apiError(e, fallback) });
    } finally {
      this.busy.set(false);
    }
  }
}
