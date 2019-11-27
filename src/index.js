/**
 * Build styles
 */
require('./index.css').toString();

/**
 * Base Paragraph Block for the Editor.js.
 * Represents simple paragraph
 *
 * @author CodeX (team@ifmo.su)
 * @copyright CodeX 2018
 * @license The MIT License (MIT)
 * @version 2.0.0
 */

/**
 * @typedef {Object} ParagraphData
 * @description Tool's input and output data format
 * @property {String} text — Paragraph's content. Can include HTML tags: <a><b><i>
 */
class Paragraph {
  /**
   * Default placeholder for Paragraph Tool
   *
   * @return {string}
   * @constructor
   */
  static get DEFAULT_PLACEHOLDER() {
    return '';
  }

  /**
   * Render plugin`s main Element and fill it with saved data
   *
   * @param {{data: ParagraphData, config: object, api: object}}
   *   data — previously saved data
   *   config - user config for Tool
   *   api - Editor.js API
   */
  constructor({data, config, api}) {
    this.api = api;

    this._CSS = {
      block: this.api.styles.block,
      settingsButton: this.api.styles.settingsButton,
      settingsButtonActive: this.api.styles.settingsButtonActive,
      wrapper: 'ce-paragraph',
      align: 'left',
    };
    this.onKeyUp = this.onKeyUp.bind(this);

    /**
     * Placeholder for paragraph if it is first Block
     * @type {string}
     */
    this._placeholder = config.placeholder ? config.placeholder : Paragraph.DEFAULT_PLACEHOLDER;
    this._data = this.normalizeData(data);
    this._element = this.drawView();
    /**
     * List of settings buttons
     * @type {HTMLElement[]}
     */
    this.settingsButtons = [];

    this.data = this._data;
  }

    /**
   * Normalize input data
   * @param {ParagraphData} data
   * @return {ParagraphData}
   * @private
   */
  normalizeData(data) {
    const newData = {};

    if (typeof data !== 'object') {
      data = {};
    }

    newData.text = data.text || '';
    newData.align = data.align || this.defaultAlign.align;

    return newData;
  }

  /**
   * Check if text content is empty and set empty string to inner html.
   * We need this because some browsers (e.g. Safari) insert <br> into empty contenteditanle elements
   *
   * @param {KeyboardEvent} e - key up event
   */
  onKeyUp(e) {
    if (e.code !== 'Backspace' && e.code !== 'Delete') {
      return;
    }

    const {textContent} = this._element;

    if (textContent === '') {
      this._element.innerHTML = '';
    }
  }

  /**
   * Create Tool's view
   * @return {HTMLElement}
   * @private
   */
  drawView() {
    let div = document.createElement('DIV');

    div.classList.add(this._CSS.wrapper, this._CSS.block);
    div.contentEditable = true;
    div.dataset.placeholder = this._placeholder;
    /**
     * Add styles align
     */
    div.style.textAlign = this._CSS.align;

    div.addEventListener('keyup', this.onKeyUp);

    return div;
  }

  /**
   * Return Tool's view
   * @returns {HTMLDivElement}
   * @public
   */
  render() {
    return this._element;
  }

  /**
   * Create Block's settings block
   *
   * @return {HTMLElement}
   */
  renderSettings() {
    let holder = document.createElement('DIV');
    /** Add align styles */
    this.align.forEach( item => {
      let selectTypeButton = document.createElement('SPAN');

      selectTypeButton.classList.add(this._CSS.settingsButton);

      /**
       * Add SVG icon
       */
      selectTypeButton.innerHTML = item.svg;

      /**
       * Save align to its button
       */
      selectTypeButton.dataset.align = item.align;

      /**
       * Set up click handler
       */
      selectTypeButton.addEventListener('click', () => {
        this.setAlign(item.align);
      });

      /**
       * Append settings button to holder
       */
      holder.appendChild(selectTypeButton);

      /**
       * Save settings buttons
       */
      this.settingsButtons.push(selectTypeButton);
    });

    return holder;
  }

  /**
   * Method that specified how to merge two Text blocks.
   * Called by Editor.js by backspace at the beginning of the Block
   * @param {ParagraphData} data
   * @public
   */
  merge(data) {
    let newData = {
      text : this.data.text + data.text
    };

    this.data = newData;
  }

  /**
   * Callback for Block's settings buttons
   * @param align
   */
  setAlign(align) {
    this.data = {
      align: align,
      text: this.data.text
    };
    /**
     * Highlight button by selected align
     */
    this.settingsButtons.forEach(button => {
      if (button.dataset.align) button.classList.toggle(this._CSS.settingsButtonActive, button.dataset.align === align);
    });
  }

  /**
   * Validate Paragraph block data:
   * - check for emptiness
   *
   * @param {ParagraphData} savedData — data received after saving
   * @returns {boolean} false if saved data is not correct, otherwise true
   * @public
   */
  validate(savedData) {
    if (savedData.text.trim() === '') {
      return false;
    }

    return true;
  }

  /**
   * Extract Tool's data from the view
   * @param {HTMLDivElement} toolsContent - Paragraph tools rendered view
   * @returns {ParagraphData} - saved data
   * @public
   */
  save(toolsContent) {
    return {
      text: toolsContent.innerHTML,
      align: this.currentAlign.align
    };
  }

  /**
   * On paste callback fired from Editor.
   *
   * @param {PasteEvent} event - event with pasted data
   */
  onPaste(event) {
    const data = {
      text: event.detail.data.innerHTML,
      align: 'left',
    };

    this.data = data;
  }

  /**
   * Enable Conversion Toolbar. Paragraph can be converted to/from other tools
   */
  static get conversionConfig() {
    return {
      export: 'text', // to convert Paragraph to other block, use 'text' property of saved data
      import: 'text' // to covert other block's exported string to Paragraph, fill 'text' property of tool data
    };
  }

  /**
   * Sanitizer rules
   */
  static get sanitize() {
    return {
      text: {
        br: true,
      },
      align: {}
    };
  }

  /**
   * Get current Tools`s data
   * @returns {ParagraphData} Current data
   * @private
   */
  get data() {
    this._data.text = this._element.innerHTML;
    this._data.align = this.currentAlign.align;

    return this._data;
  }

  /**
   * Return default align
   * @returns {align}
   */
  get defaultAlign() {
    /**
     * Use left as default align
     */
    return this.align[0];
  }

  /**
   * Get current align
   * @return {align}
   */
  get currentAlign() {
    let align = this.align.find(item => item.align === this._data.align);

    if (!align) {
      align = this.defaultAlign;
    }

    return align;
  }

  /**
   * Available header levels
   * @return {level[]}
   */
  get align() {
    return [
      {
        align: 'left',
        svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.25 3.75V2.25H15.75V3.75H2.25ZM11.25 5.25H2.25V6.75H11.25V5.25ZM11.25 11.25H2.25V12.75H11.25V11.25ZM15.75 9.75H2.25V8.25H15.75V9.75ZM2.25 15.75H15.75V14.25H2.25V15.75Z" fill="currentColor"/></svg>'
      },
      {
        align: 'center',
        svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.25 3.75V2.25H15.75V3.75H2.25ZM5.25 5.25V6.75H12.75V5.25H5.25ZM15.75 9.75H2.25V8.25H15.75V9.75ZM5.25 11.25V12.75H12.75V11.25H5.25ZM2.25 15.75H15.75V14.25H2.25V15.75Z" fill="currentColor"/></svg>'
      },
      {
        align: 'right',
        svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.25 3.75V2.25H15.75V3.75H2.25ZM6.75 6.75H15.75V5.25H6.75V6.75ZM15.75 9.75H2.25V8.25H15.75V9.75ZM6.75 12.75H15.75V11.25H6.75V12.75ZM2.25 15.75H15.75V14.25H2.25V15.75Z" fill="currentColor"/></svg>'
      },
    ];
  }

  /**
   * Store data in plugin:
   * - at the this._data property
   * - at the HTML
   *
   * @param {ParagraphData} data — data to set
   * @private
   */
  set data(data) {
    this._data = this.normalizeData(data);
    /**
     * If align is set and block in DOM
     * then replace it to a new block
     */
    if (data.align !== undefined) {
      /**
       * Save Block's align
       */
      this._element.style.textAlign = data.align;
    }

    /**
     * If data.text was passed then update block's content
     */
    if (data.text !== undefined) {
      this._element.innerHTML = data.text || '';
    }
  }

  /**
   * Used by Editor paste handling API.
   * Provides configuration to handle P tags.
   *
   * @returns {{tags: string[]}}
   */
  static get pasteConfig() {
    return {
      tags: [ 'P' ]
    };
  }

  /**
   * Icon and title for displaying at the Toolbox
   *
   * @return {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 4.5V7.5H10.5V19.5H13.5V7.5H19V4.5H5Z" fill="currentColor"/></svg>',
      title: 'Text'
    };
  }
}

module.exports = Paragraph;
