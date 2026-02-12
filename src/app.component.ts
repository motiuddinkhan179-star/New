
import { ChangeDetectionStrategy, Component, DomSanitizer, inject, signal, computed, SafeHtml } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GeminiService } from './services/gemini.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CommonModule]
})
export class AppComponent {
  private readonly geminiService = inject(GeminiService);
  private readonly sanitizer = inject(DomSanitizer);

  prompt = signal<string>('A modern landing page for a SaaS product that helps with project management. It should have a hero section with a call-to-action, a features section, a pricing table, and a simple footer.');
  highQuality = signal<boolean>(false);
  generatedHtml = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  examplePrompts = [
    'A personal portfolio website for a photographer, with a gallery section.',
    'An e-commerce product page for a new brand of smart headphones.',
    'A blog homepage with a clean, minimalist design and a list of recent articles.',
    'A recipe card for chocolate chip cookies, with ingredients and instructions.'
  ];

  safeGeneratedHtml = computed<SafeHtml | null>(() => {
    const html = this.generatedHtml();
    return html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
  });

  async generateWebsite(): Promise<void> {
    if (!this.prompt().trim()) {
      this.error.set('Please enter a description for the website you want to build.');
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);
    this.generatedHtml.set(null);

    try {
      const html = await this.geminiService.generateWebsite(this.prompt(), this.highQuality());
      this.generatedHtml.set(html);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      this.error.set(`Failed to generate website. Please try again. Error: ${errorMessage}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  setExamplePrompt(prompt: string): void {
    this.prompt.set(prompt);
  }
}
