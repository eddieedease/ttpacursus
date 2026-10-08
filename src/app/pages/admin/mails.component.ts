import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MailLogEntry, MailPlaceholder, MailTemplate } from '../../models';
import { MailService } from '../../services/mail.service';
import { apiError } from '../../shared/api-error';

@Component({
  selector: 'app-admin-mails',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

      <!-- Template list -->
      <div class="self-start space-y-3">
        <h2 class="text-sm font-semibold text-slate-700 uppercase tracking-wide">Sjablonen</h2>
        @for (tpl of templates(); track tpl.key) {
          <button
            type="button"
            class="w-full text-left bg-white rounded-xl border p-4 shadow-sm transition-colors"
            [class]="selectedKey() === tpl.key ? 'border-teal-500 ring-2 ring-teal-200' : 'border-slate-200 hover:border-slate-400'"
            [attr.aria-pressed]="selectedKey() === tpl.key"
            (click)="select(tpl)"
          >
            <span class="block font-semibold text-slate-900">{{ tpl.name }}</span>
            <span class="block text-xs text-slate-600 mt-1">{{ tpl.description }}</span>
          </button>
        }

        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h3 class="text-sm font-semibold text-slate-800 mb-2">Beschikbare velden</h3>
          <p class="text-xs text-slate-600 mb-3">Klik om in te voegen op de plek van de cursor in de tekst.</p>
          <ul class="space-y-1.5 list-none p-0 m-0">
            @for (ph of placeholders(); track ph.key) {
              <li>
                <button type="button" class="font-mono text-xs bg-slate-100 hover:bg-teal-100 text-slate-800 px-1.5 py-0.5 rounded"
                        (click)="insert(ph.key)">{{ token(ph.key) }}</button>
                <span class="text-xs text-slate-600 ml-1">{{ ph.label }}</span>
              </li>
            }
          </ul>
        </div>
      </div>

      <!-- Editor -->
      <div class="lg:col-span-2 self-start bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        @if (selected(); as tpl) {
          <h2 class="text-base font-semibold text-slate-800 mb-4">{{ tpl.name }}</h2>
          <form [formGroup]="form" (ngSubmit)="save()" novalidate class="space-y-4">
            <div>
              <label for="tpl-subject" class="form-label">Onderwerp</label>
              <input id="tpl-subject" #subjectField type="text" formControlName="subject" class="form-input" (focus)="lastField = 'subject'">
            </div>
            <div>
              <label for="tpl-body" class="form-label">Tekst</label>
              <textarea id="tpl-body" #bodyField formControlName="body" rows="16" class="form-input font-mono text-[13px] leading-relaxed"
                        (focus)="lastField = 'body'"></textarea>
            </div>

            @if (message(); as m) {
              <p class="text-sm" [class]="m.ok ? 'text-teal-800' : 'text-red-700'" role="status">{{ m.text }}</p>
            }

            <div class="flex flex-wrap items-end gap-3 justify-between">
              <button type="submit" [disabled]="busy() || form.invalid"
                class="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors">
                Opslaan
              </button>
              <div class="flex items-end gap-2">
                <div>
                  <label for="tpl-test" class="form-label">Testmail naar</label>
                  <input id="tpl-test" type="email" class="form-input" [value]="testTo()" (input)="onTestTo($event)" autocomplete="email">
                </div>
                <button type="button" [disabled]="busy()" (click)="test()"
                  class="text-sm font-semibold text-teal-800 border border-teal-400 hover:bg-teal-50 px-4 py-2.5 rounded-lg disabled:opacity-50">
                  Verstuur test
                </button>
              </div>
            </div>
            <p class="text-xs text-slate-600">De testmail gebruikt het opgeslagen sjabloon met voorbeeldgegevens.</p>
          </form>
        } @else {
          <p class="text-slate-600">@if (loading()) { Sjablonen worden geladen… } @else { Kies een sjabloon. }</p>
        }
      </div>
    </div>

    <!-- Log -->
    <h2 class="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Verzonden e-mails (laatste 200)</h2>
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm" aria-label="Verzonden e-mails">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-left">
              <th scope="col" class="px-4 py-3 font-semibold text-slate-700">Datum</th>
              <th scope="col" class="px-4 py-3 font-semibold text-slate-700">Aan</th>
              <th scope="col" class="px-4 py-3 font-semibold text-slate-700">Onderwerp</th>
              <th scope="col" class="px-4 py-3 font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody>
            @for (entry of log(); track entry.id) {
              <tr class="border-b border-slate-100">
                <td class="px-4 py-2.5 text-slate-700 whitespace-nowrap">{{ entry.createdAt | date:'d MMM y, HH:mm' }}</td>
                <td class="px-4 py-2.5 text-slate-700">{{ entry.recipient }}</td>
                <td class="px-4 py-2.5 text-slate-800">{{ entry.subject }}</td>
                <td class="px-4 py-2.5">
                  @if (entry.status === 'verzonden') {
                    <span class="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-100 text-teal-800">verzonden</span>
                  } @else {
                    <span class="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-800" [title]="entry.error ?? ''">mislukt</span>
                    <span class="block text-xs text-red-700 mt-1">{{ entry.error }}</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="4" class="px-4 py-8 text-center text-slate-600">Nog geen e-mails verzonden.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    @reference "tailwindcss";
    .form-label { @apply block text-sm font-medium text-slate-700 mb-1; }
    .form-input {
      @apply w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm
             focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors;
    }
  `],
})
export class AdminMailsComponent {
  private readonly mailService = inject(MailService);

  readonly templates = signal<MailTemplate[]>([]);
  readonly placeholders = signal<MailPlaceholder[]>([]);
  readonly log = signal<MailLogEntry[]>([]);
  readonly selectedKey = signal<string | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly message = signal<{ ok: boolean; text: string } | null>(null);
  readonly testTo = signal('');

  readonly selected = computed(() => this.templates().find(t => t.key === this.selectedKey()) ?? null);

  private readonly subjectField = viewChild<ElementRef<HTMLInputElement>>('subjectField');
  private readonly bodyField = viewChild<ElementRef<HTMLTextAreaElement>>('bodyField');

  /** Field that last had focus; placeholders are inserted there. */
  lastField: 'subject' | 'body' = 'body';

  readonly form = new FormBuilder().nonNullable.group({
    subject: ['', Validators.required],
    body: ['', Validators.required],
  });

  constructor() {
    this.load();
  }

  private async load(): Promise<void> {
    try {
      const [{ templates, placeholders }, log] = await Promise.all([this.mailService.templates(), this.mailService.log()]);
      this.templates.set(templates);
      this.placeholders.set(placeholders);
      this.log.set(log);
      if (!this.selectedKey() && templates.length) {
        this.select(templates[0]);
      }
    } catch {
      this.message.set({ ok: false, text: 'Gegevens konden niet worden geladen.' });
    } finally {
      this.loading.set(false);
    }
  }

  select(tpl: MailTemplate): void {
    this.selectedKey.set(tpl.key);
    this.message.set(null);
    this.form.setValue({ subject: tpl.subject, body: tpl.body });
  }

  token(key: string): string {
    return `{{${key}}}`;
  }

  insert(key: string): void {
    const el = (this.lastField === 'subject' ? this.subjectField() : this.bodyField())?.nativeElement;
    const control = this.form.controls[this.lastField];
    const value = control.value;
    const token = this.token(key);
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    control.setValue(value.slice(0, start) + token + value.slice(end));
    control.markAsDirty();
    if (el) {
      el.focus();
      queueMicrotask(() => el.setSelectionRange(start + token.length, start + token.length));
    }
  }

  onTestTo(event: Event): void {
    this.testTo.set((event.target as HTMLInputElement).value);
  }

  async save(): Promise<void> {
    const key = this.selectedKey();
    if (!key || this.form.invalid) {
      return;
    }
    await this.run(async () => {
      const { subject, body } = this.form.getRawValue();
      await this.mailService.saveTemplate(key, subject, body);
      this.templates.update(list => list.map(t => (t.key === key ? { ...t, subject, body } : t)));
      this.form.markAsPristine();
      return 'Sjabloon opgeslagen.';
    }, 'Het sjabloon kon niet worden opgeslagen.');
  }

  async test(): Promise<void> {
    const key = this.selectedKey();
    if (!key) {
      return;
    }
    if (this.form.dirty) {
      this.message.set({ ok: false, text: 'Sla het sjabloon eerst op; de test gebruikt de opgeslagen versie.' });
      return;
    }
    await this.run(async () => {
      await this.mailService.testTemplate(key, this.testTo());
      this.log.set(await this.mailService.log());
      return `Testmail verstuurd naar ${this.testTo()}.`;
    }, 'De testmail kon niet worden verstuurd.');
  }

  private async run(action: () => Promise<string>, fallback: string): Promise<void> {
    this.busy.set(true);
    try {
      this.message.set({ ok: true, text: await action() });
    } catch (e) {
      this.message.set({ ok: false, text: apiError(e, fallback) });
      this.log.set(await this.mailService.log().catch(() => this.log()));
    } finally {
      this.busy.set(false);
    }
  }
}
