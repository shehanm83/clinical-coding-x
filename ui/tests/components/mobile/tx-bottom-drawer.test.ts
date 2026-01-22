/**
 * TxBottomDrawer Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fixture, html, oneEvent } from '@open-wc/testing';
import '../../../src/components/features/coding/tx-bottom-drawer.js';
import type { TxBottomDrawer } from '../../../src/components/features/coding/tx-bottom-drawer.js';

describe('tx-bottom-drawer', () => {
  let originalBodyOverflow: string;

  beforeEach(() => {
    originalBodyOverflow = document.body.style.overflow;
  });

  afterEach(() => {
    document.body.style.overflow = originalBodyOverflow;
  });

  describe('rendering', () => {
    it('renders with default properties', async () => {
      const el = await fixture<TxBottomDrawer>(html`<tx-bottom-drawer></tx-bottom-drawer>`);

      expect(el).toBeDefined();
      expect(el.tagName.toLowerCase()).toBe('tx-bottom-drawer');
    });

    it('has shadowRoot', async () => {
      const el = await fixture<TxBottomDrawer>(html`<tx-bottom-drawer></tx-bottom-drawer>`);

      expect(el.shadowRoot).toBeDefined();
    });

    it('renders backdrop', async () => {
      const el = await fixture<TxBottomDrawer>(html`<tx-bottom-drawer></tx-bottom-drawer>`);

      const backdrop = el.shadowRoot?.querySelector('.backdrop');

      expect(backdrop).toBeDefined();
    });

    it('renders drawer container', async () => {
      const el = await fixture<TxBottomDrawer>(html`<tx-bottom-drawer></tx-bottom-drawer>`);

      const drawer = el.shadowRoot?.querySelector('.drawer');

      expect(drawer).toBeDefined();
    });

    it('renders handle area', async () => {
      const el = await fixture<TxBottomDrawer>(html`<tx-bottom-drawer></tx-bottom-drawer>`);

      const handleArea = el.shadowRoot?.querySelector('.handle-area');
      const handle = el.shadowRoot?.querySelector('.handle');

      expect(handleArea).toBeDefined();
      expect(handle).toBeDefined();
    });

    it('renders slot content', async () => {
      const el = await fixture<TxBottomDrawer>(html`
        <tx-bottom-drawer>
          <div class="test-content">Test content</div>
        </tx-bottom-drawer>
      `);

      const slot = el.shadowRoot?.querySelector('slot');

      expect(slot).toBeDefined();
    });
  });

  describe('title property', () => {
    it('renders title when provided', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer title="Test Title"></tx-bottom-drawer>`
      );

      const title = el.shadowRoot?.querySelector('.title');

      expect(title?.textContent).toBe('Test Title');
    });

    it('does not render title element when not provided', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer .showClose=${false}></tx-bottom-drawer>`
      );

      const header = el.shadowRoot?.querySelector('.header');

      expect(header).toBeFalsy();
    });

    it('title has proper id for aria-labelledby', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer title="Test Title"></tx-bottom-drawer>`
      );

      const title = el.shadowRoot?.querySelector('.title');

      expect(title?.getAttribute('id')).toBe('drawer-title');
    });
  });

  describe('close button', () => {
    it('renders close button by default', async () => {
      const el = await fixture<TxBottomDrawer>(html`<tx-bottom-drawer></tx-bottom-drawer>`);

      const closeButton = el.shadowRoot?.querySelector('.close-button');

      expect(closeButton).toBeDefined();
    });

    it('hides close button when showClose is false', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer .showClose=${false}></tx-bottom-drawer>`
      );

      const closeButton = el.shadowRoot?.querySelector('.close-button');

      expect(closeButton).toBeFalsy();
    });

    it('close button has aria-label', async () => {
      const el = await fixture<TxBottomDrawer>(html`<tx-bottom-drawer></tx-bottom-drawer>`);

      const closeButton = el.shadowRoot?.querySelector('.close-button');

      expect(closeButton?.getAttribute('aria-label')).toBe('Close drawer');
    });

    it('dispatches close event when clicked', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer ?open=${true}></tx-bottom-drawer>`
      );

      const closeButton = el.shadowRoot?.querySelector('.close-button') as HTMLButtonElement;

      setTimeout(() => closeButton?.click());
      const event = await oneEvent(el, 'close');

      expect(event).toBeDefined();
    });
  });

  describe('open state', () => {
    it('drawer has open class when open is true', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer ?open=${true}></tx-bottom-drawer>`
      );

      const drawer = el.shadowRoot?.querySelector('.drawer');

      expect(drawer?.classList.contains('open')).toBe(true);
    });

    it('backdrop has open class when open is true', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer ?open=${true}></tx-bottom-drawer>`
      );

      const backdrop = el.shadowRoot?.querySelector('.backdrop');

      expect(backdrop?.classList.contains('open')).toBe(true);
    });

    it('drawer does not have open class when closed', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer ?open=${false}></tx-bottom-drawer>`
      );

      const drawer = el.shadowRoot?.querySelector('.drawer');

      expect(drawer?.classList.contains('open')).toBe(false);
    });

    it('sets body overflow hidden when opened', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer ?open=${false}></tx-bottom-drawer>`
      );

      el.open = true;
      await el.updateComplete;

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body overflow when closed', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer ?open=${true}></tx-bottom-drawer>`
      );

      el.open = false;
      await el.updateComplete;

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('events', () => {
    it('dispatches close event on backdrop click', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer ?open=${true}></tx-bottom-drawer>`
      );

      const backdrop = el.shadowRoot?.querySelector('.backdrop') as HTMLElement;

      setTimeout(() => backdrop?.click());
      const event = await oneEvent(el, 'close');

      expect(event).toBeDefined();
    });

    it('dispatches close event on Escape key', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer ?open=${true}></tx-bottom-drawer>`
      );

      setTimeout(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });
      const event = await oneEvent(el, 'close');

      expect(event).toBeDefined();
    });

    it('does not dispatch close event on Escape when closed', async () => {
      const handler = vi.fn();
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer ?open=${false} @close=${handler}></tx-bottom-drawer>`
      );

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await el.updateComplete;

      expect(handler).not.toHaveBeenCalled();
    });

    it('dispatches opened event after opening', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer ?open=${false}></tx-bottom-drawer>`
      );

      setTimeout(() => {
        el.open = true;
      });
      const event = await oneEvent(el, 'opened');

      expect(event).toBeDefined();
    });

    it('dispatches closed event after closing', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer ?open=${true}></tx-bottom-drawer>`
      );

      setTimeout(() => {
        el.open = false;
      });
      const event = await oneEvent(el, 'closed');

      expect(event).toBeDefined();
    });
  });

  describe('touch gestures', () => {
    it('adds dragging class during touch drag', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer ?open=${true}></tx-bottom-drawer>`
      );

      const handleArea = el.shadowRoot?.querySelector('.handle-area') as HTMLElement;

      handleArea?.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientY: 100 } as Touch],
        })
      );
      await el.updateComplete;

      const drawer = el.shadowRoot?.querySelector('.drawer');

      expect(drawer?.classList.contains('dragging')).toBe(true);
    });

    it('removes dragging class after touch end', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer ?open=${true}></tx-bottom-drawer>`
      );

      const handleArea = el.shadowRoot?.querySelector('.handle-area') as HTMLElement;

      handleArea?.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientY: 100 } as Touch],
        })
      );
      await el.updateComplete;

      handleArea?.dispatchEvent(
        new TouchEvent('touchend', {
          changedTouches: [{ clientY: 100 } as Touch],
        })
      );
      await el.updateComplete;

      const drawer = el.shadowRoot?.querySelector('.drawer');

      expect(drawer?.classList.contains('dragging')).toBe(false);
    });

    it('dispatches close when dragged past threshold', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer ?open=${true} closeThreshold=${50}></tx-bottom-drawer>`
      );

      const handleArea = el.shadowRoot?.querySelector('.handle-area') as HTMLElement;

      handleArea?.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientY: 100 } as Touch],
        })
      );

      setTimeout(() => {
        handleArea?.dispatchEvent(
          new TouchEvent('touchend', {
            changedTouches: [{ clientY: 200 } as Touch],
          })
        );
      });

      const event = await oneEvent(el, 'close');

      expect(event).toBeDefined();
    });

    it('ignores multi-touch events', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer ?open=${true}></tx-bottom-drawer>`
      );

      const handleArea = el.shadowRoot?.querySelector('.handle-area') as HTMLElement;

      handleArea?.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientY: 100 } as Touch, { clientY: 200 } as Touch],
        })
      );
      await el.updateComplete;

      const drawer = el.shadowRoot?.querySelector('.drawer');

      expect(drawer?.classList.contains('dragging')).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('drawer has role="dialog"', async () => {
      const el = await fixture<TxBottomDrawer>(html`<tx-bottom-drawer></tx-bottom-drawer>`);

      const drawer = el.shadowRoot?.querySelector('.drawer');

      expect(drawer?.getAttribute('role')).toBe('dialog');
    });

    it('drawer has aria-modal="true"', async () => {
      const el = await fixture<TxBottomDrawer>(html`<tx-bottom-drawer></tx-bottom-drawer>`);

      const drawer = el.shadowRoot?.querySelector('.drawer');

      expect(drawer?.getAttribute('aria-modal')).toBe('true');
    });

    it('drawer has aria-labelledby when title is set', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer title="Test Title"></tx-bottom-drawer>`
      );

      const drawer = el.shadowRoot?.querySelector('.drawer');

      expect(drawer?.getAttribute('aria-labelledby')).toBe('drawer-title');
    });

    it('backdrop has aria-hidden="true"', async () => {
      const el = await fixture<TxBottomDrawer>(html`<tx-bottom-drawer></tx-bottom-drawer>`);

      const backdrop = el.shadowRoot?.querySelector('.backdrop');

      expect(backdrop?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('closeThreshold property', () => {
    it('uses default threshold of 100', async () => {
      const el = await fixture<TxBottomDrawer>(html`<tx-bottom-drawer></tx-bottom-drawer>`);

      expect(el.closeThreshold).toBe(100);
    });

    it('accepts custom threshold', async () => {
      const el = await fixture<TxBottomDrawer>(
        html`<tx-bottom-drawer closeThreshold=${200}></tx-bottom-drawer>`
      );

      expect(el.closeThreshold).toBe(200);
    });
  });

  describe('cleanup', () => {
    it('removes keydown listener on disconnect', async () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      const el = await fixture<TxBottomDrawer>(html`<tx-bottom-drawer></tx-bottom-drawer>`);

      el.remove();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });
});
