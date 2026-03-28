/**
 * UI Adapter
 * Implements UIPort interface
 * Adapts existing UI services to port contract
 */

import { UIPort } from '../../core/ports/index';
import { 
  renderCommitMessage, 
  renderDryRun, 
  renderSuccess, 
  renderError, 
  renderWarning 
} from '../../cli/ui/renderer';
import { reviewCommitMessage, editCommitMessage } from '../../cli/ui/prompts';
import ora from 'ora';

export class UIAdapter implements UIPort {
  private spinner: ReturnType<typeof ora> | null = null;

  renderCommitMessage(message: string): void {
    renderCommitMessage(message);
  }

  renderDryRun(commands: string[]): void {
    renderDryRun(commands);
  }

  renderSuccess(message: string): void {
    renderSuccess(message);
  }

  renderError(message: string): void {
    renderError(message);
  }

  renderWarning(message: string): void {
    renderWarning(message);
  }

  async promptCommitReview(message: string): Promise<'execute' | 'regenerate' | 'edit' | 'cancel'> {
    return await reviewCommitMessage(message);
  }

  async promptCommitEdit(message: string): Promise<string> {
    return await editCommitMessage(message);
  }

  startSpinner(message: string): void {
    this.spinner = ora(message).start();
  }

  succeedSpinner(message: string): void {
    if (this.spinner) {
      this.spinner.succeed(message);
      this.spinner = null;
    }
  }

  failSpinner(message: string): void {
    if (this.spinner) {
      this.spinner.fail(message);
      this.spinner = null;
    }
  }
}
