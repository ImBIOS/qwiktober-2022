/**
 * @license
 * @builder.io/qwik 0.9.0
 * Copyright Builder.io, Inc. All Rights Reserved.
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */
const EMPTY_ARRAY$1 = [];
const EMPTY_OBJ$1 = {};
const isSerializableObject = (v) => {
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || null === proto;
};
const isObject = (v) => v && "object" == typeof v;
const isArray = (v) => Array.isArray(v);
const isString = (v) => "string" == typeof v;
const isFunction = (v) => "function" == typeof v;
const QSlot = "q:slot";
const isPromise = (value) => value instanceof Promise;
const safeCall = (call, thenFn, rejectFn) => {
  try {
    const promise = call();
    return isPromise(promise)
      ? promise.then(thenFn, rejectFn)
      : thenFn(promise);
  } catch (e) {
    return rejectFn(e);
  }
};
const then = (promise, thenFn) =>
  isPromise(promise) ? promise.then(thenFn) : thenFn(promise);
const promiseAll = (promises) =>
  promises.some(isPromise) ? Promise.all(promises) : promises;
const isNotNullable = (v) => null != v;
const delay = (timeout) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
let _context;
const tryGetInvokeContext = () => {
  if (!_context) {
    const context =
      "undefined" != typeof document && document && document.__q_context__;
    if (!context) {
      return;
    }
    return isArray(context)
      ? (document.__q_context__ = newInvokeContextFromTuple(context))
      : context;
  }
  return _context;
};
const getInvokeContext = () => {
  const ctx = tryGetInvokeContext();
  if (!ctx) {
    throw qError(QError_useMethodOutsideContext);
  }
  return ctx;
};
const useInvokeContext = () => {
  const ctx = getInvokeContext();
  if ("qRender" !== ctx.$event$) {
    throw qError(QError_useInvokeContext);
  }
  return (
    ctx.$hostElement$, ctx.$waitOn$, ctx.$renderCtx$, ctx.$subscriber$, ctx
  );
};
const invoke = (context, fn, ...args) => {
  const previousContext = _context;
  let returnValue;
  try {
    (_context = context), (returnValue = fn.apply(null, args));
  } finally {
    _context = previousContext;
  }
  return returnValue;
};
const waitAndRun = (ctx, callback) => {
  const waitOn = ctx.$waitOn$;
  if (0 === waitOn.length) {
    const result = callback();
    isPromise(result) && waitOn.push(result);
  } else {
    waitOn.push(Promise.all(waitOn).then(callback));
  }
};
const newInvokeContextFromTuple = (context) => {
  const element = context[0];
  return newInvokeContext(void 0, element, context[1], context[2]);
};
const newInvokeContext = (hostElement, element, event, url) => ({
  $seq$: 0,
  $hostElement$: hostElement,
  $element$: element,
  $event$: event,
  $url$: url,
  $qrl$: void 0,
  $props$: void 0,
  $renderCtx$: void 0,
  $subscriber$: void 0,
  $waitOn$: void 0,
});
const getWrappingContainer = (el) => el.closest("[q\\:container]");
const isNode = (value) => value && "number" == typeof value.nodeType;
const isDocument = (value) => value && 9 === value.nodeType;
const isElement = (value) => 1 === value.nodeType;
const isQwikElement = (value) =>
  isNode(value) && (1 === value.nodeType || 111 === value.nodeType);
const isVirtualElement = (value) => 111 === value.nodeType;
const isModule = (module) =>
  isObject(module) && "Module" === module[Symbol.toStringTag];
let _platform = (() => {
  const moduleCache = /* @__PURE__ */ new Map();
  return {
    isServer: false,
    importSymbol(containerEl, url, symbolName) {
      const urlDoc = ((doc, containerEl2, url2) => {
        var _a2;
        const baseURI = doc.baseURI;
        const base = new URL(
          (_a2 = containerEl2.getAttribute("q:base")) != null ? _a2 : baseURI,
          baseURI
        );
        return new URL(url2, base);
      })(containerEl.ownerDocument, containerEl, url).toString();
      const urlCopy = new URL(urlDoc);
      (urlCopy.hash = ""), (urlCopy.search = "");
      const importURL = urlCopy.href;
      const mod = moduleCache.get(importURL);
      return mod
        ? mod[symbolName]
        : import(importURL).then((mod2) => {
            return (
              (module = mod2),
              (mod2 = Object.values(module).find(isModule) || module),
              moduleCache.set(importURL, mod2),
              mod2[symbolName]
            );
            var module;
          });
    },
    raf: (fn) =>
      new Promise((resolve) => {
        requestAnimationFrame(() => {
          resolve(fn());
        });
      }),
    nextTick: (fn) =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve(fn());
        });
      }),
    chunkForSymbol() {},
  };
})();
const setPlatform = (plt) => (_platform = plt);
const getPlatform = () => _platform;
const isServer$1 = () => _platform.isServer;
const directSetAttribute = (el, prop, value) => el.setAttribute(prop, value);
const directGetAttribute = (el, prop) => el.getAttribute(prop);
const ON_PROP_REGEX = /^(on|window:|document:)/;
const isOnProp = (prop) => prop.endsWith("$") && ON_PROP_REGEX.test(prop);
const addQRLListener = (listenersMap, prop, input) => {
  let existingListeners = listenersMap[prop];
  existingListeners || (listenersMap[prop] = existingListeners = []);
  for (const qrl of input) {
    const hash = qrl.$hash$;
    let replaced = false;
    for (let i = 0; i < existingListeners.length; i++) {
      if (existingListeners[i].$hash$ === hash) {
        existingListeners.splice(i, 1, qrl), (replaced = true);
        break;
      }
    }
    replaced || existingListeners.push(qrl);
  }
  return false;
};
const setEvent = (listenerMap, prop, input) => {
  prop.endsWith("$");
  const qrls = isArray(input) ? input.map(ensureQrl) : [ensureQrl(input)];
  return (
    (prop = normalizeOnProp(prop.slice(0, -1))),
    addQRLListener(listenerMap, prop, qrls),
    prop
  );
};
const ensureQrl = (value) => (isQrl$1(value) ? value : $(value));
const getDomListeners = (ctx, containerEl) => {
  const attributes = ctx.$element$.attributes;
  const listeners = {};
  for (let i = 0; i < attributes.length; i++) {
    const { name, value } = attributes.item(i);
    if (
      name.startsWith("on:") ||
      name.startsWith("on-window:") ||
      name.startsWith("on-document:")
    ) {
      let array = listeners[name];
      array || (listeners[name] = array = []);
      const urls = value.split("\n");
      for (const url of urls) {
        const qrl = parseQRL(url, containerEl);
        qrl.$capture$ && inflateQrl(qrl, ctx), array.push(qrl);
      }
    }
  }
  return listeners;
};
const useSequentialScope = () => {
  const ctx = useInvokeContext();
  const i = ctx.$seq$;
  const hostElement = ctx.$hostElement$;
  const elCtx = getContext(hostElement);
  const seq = elCtx.$seq$ ? elCtx.$seq$ : (elCtx.$seq$ = []);
  return (
    ctx.$seq$++,
    {
      get: seq[i],
      set: (value) => (seq[i] = value),
      i,
      ctx,
    }
  );
};
const useOn = (event, eventQrl) => _useOn(`on-${event}`, eventQrl);
const _useOn = (eventName, eventQrl) => {
  const invokeCtx = useInvokeContext();
  const ctx = getContext(invokeCtx.$hostElement$);
  addQRLListener(ctx.li, normalizeOnProp(eventName), [eventQrl]);
};
const getDocument = (node) =>
  "undefined" != typeof document
    ? document
    : 9 === node.nodeType
    ? node
    : node.ownerDocument;
const jsx = (type, props, key) => {
  const processed = null == key ? null : String(key);
  return new JSXNodeImpl(type, props, processed);
};
class JSXNodeImpl {
  constructor(type, props, key = null) {
    (this.type = type), (this.props = props), (this.key = key);
  }
}
const isJSXNode = (n) => n instanceof JSXNodeImpl;
const Fragment = (props) => props.children;
const SkipRender = Symbol("skip render");
const SSRComment = () => null;
const Virtual = (props) => props.children;
const InternalSSRStream = () => null;
const fromCamelToKebabCase = (text) =>
  text.replace(/([A-Z])/g, "-$1").toLowerCase();
const setAttribute = (ctx, el, prop, value) => {
  ctx
    ? ctx.$operations$.push({
        $operation$: _setAttribute,
        $args$: [el, prop, value],
      })
    : _setAttribute(el, prop, value);
};
const _setAttribute = (el, prop, value) => {
  if (null == value || false === value) {
    el.removeAttribute(prop);
  } else {
    const str = true === value ? "" : String(value);
    directSetAttribute(el, prop, str);
  }
};
const setProperty = (ctx, node, key, value) => {
  ctx
    ? ctx.$operations$.push({
        $operation$: _setProperty,
        $args$: [node, key, value],
      })
    : _setProperty(node, key, value);
};
const _setProperty = (node, key, value) => {
  try {
    node[key] = value;
  } catch (err) {
    logError(
      codeToText(QError_setProperty),
      {
        node,
        key,
        value,
      },
      err
    );
  }
};
const createElement = (doc, expectTag, isSvg) =>
  isSvg ? doc.createElementNS(SVG_NS, expectTag) : doc.createElement(expectTag);
const insertBefore = (ctx, parent, newChild, refChild) => (
  ctx.$operations$.push({
    $operation$: directInsertBefore,
    $args$: [parent, newChild, refChild || null],
  }),
  newChild
);
const appendChild = (ctx, parent, newChild) => (
  ctx.$operations$.push({
    $operation$: directAppendChild,
    $args$: [parent, newChild],
  }),
  newChild
);
const appendHeadStyle = (ctx, styleTask) => {
  ctx.$containerState$.$styleIds$.add(styleTask.styleId),
    ctx.$postOperations$.push({
      $operation$: _appendHeadStyle,
      $args$: [ctx.$containerState$.$containerEl$, styleTask],
    });
};
const _setClasslist = (elm, toRemove, toAdd) => {
  const classList = elm.classList;
  classList.remove(...toRemove), classList.add(...toAdd);
};
const _appendHeadStyle = (containerEl, styleTask) => {
  const doc = getDocument(containerEl);
  const isDoc = doc.documentElement === containerEl;
  const headEl = doc.head;
  const style = doc.createElement("style");
  directSetAttribute(style, "q:style", styleTask.styleId),
    (style.textContent = styleTask.content),
    isDoc && headEl
      ? directAppendChild(headEl, style)
      : directInsertBefore(containerEl, style, containerEl.firstChild);
};
const removeNode = (ctx, el) => {
  ctx.$operations$.push({
    $operation$: _removeNode,
    $args$: [el, ctx],
  });
};
const _removeNode = (el, staticCtx) => {
  const parent = el.parentElement;
  if (parent) {
    if (1 === el.nodeType || 111 === el.nodeType) {
      const subsManager = staticCtx.$containerState$.$subsManager$;
      cleanupTree(el, staticCtx, subsManager, true);
    }
    directRemoveChild(parent, el);
  }
};
const createTemplate = (doc, slotName) => {
  const template = createElement(doc, "q:template", false);
  return (
    directSetAttribute(template, QSlot, slotName),
    directSetAttribute(template, "hidden", ""),
    directSetAttribute(template, "aria-hidden", "true"),
    template
  );
};
const executeDOMRender = (ctx) => {
  for (const op of ctx.$operations$) {
    op.$operation$.apply(void 0, op.$args$);
  }
  resolveSlotProjection(ctx);
};
const getKey = (el) => directGetAttribute(el, "q:key");
const setKey = (el, key) => {
  null !== key && directSetAttribute(el, "q:key", key);
};
const resolveSlotProjection = (ctx) => {
  const subsManager = ctx.$containerState$.$subsManager$;
  ctx.$rmSlots$.forEach((slotEl) => {
    const key = getKey(slotEl);
    const slotChildren = getChildren(slotEl, "root");
    if (slotChildren.length > 0) {
      const sref = slotEl.getAttribute("q:sref");
      const hostCtx = ctx.$roots$.find((r) => r.$id$ === sref);
      if (hostCtx) {
        const template = createTemplate(ctx.$doc$, key);
        const hostElm = hostCtx.$element$;
        for (const child of slotChildren) {
          directAppendChild(template, child);
        }
        directInsertBefore(hostElm, template, hostElm.firstChild);
      } else {
        cleanupTree(slotEl, ctx, subsManager, false);
      }
    }
  }),
    ctx.$addSlots$.forEach(([slotEl, hostElm]) => {
      const key = getKey(slotEl);
      const template = Array.from(hostElm.childNodes).find(
        (node) => isSlotTemplate(node) && node.getAttribute(QSlot) === key
      );
      template &&
        (getChildren(template, "root").forEach((child) => {
          directAppendChild(slotEl, child);
        }),
        template.remove());
    });
};
class VirtualElementImpl {
  constructor(open, close) {
    (this.open = open),
      (this.close = close),
      (this._qc_ = null),
      (this.nodeType = 111),
      (this.localName = ":virtual"),
      (this.nodeName = ":virtual");
    const doc = (this.ownerDocument = open.ownerDocument);
    (this.template = createElement(doc, "template", false)),
      (this.attributes = ((str) => {
        if (!str) {
          return /* @__PURE__ */ new Map();
        }
        const attributes = str.split(" ");
        return new Map(
          attributes.map((attr) => {
            const index2 = attr.indexOf("=");
            return index2 >= 0
              ? [
                  attr.slice(0, index2),
                  ((s = attr.slice(index2 + 1)), s.replace(/\+/g, " ")),
                ]
              : [attr, ""];
            var s;
          })
        );
      })(open.data.slice(3))),
      open.data.startsWith("qv "),
      (open.__virtual = this);
  }
  insertBefore(node, ref) {
    const parent = this.parentElement;
    if (parent) {
      const ref2 = ref || this.close;
      parent.insertBefore(node, ref2);
    } else {
      this.template.insertBefore(node, ref);
    }
    return node;
  }
  remove() {
    const parent = this.parentElement;
    if (parent) {
      const ch = Array.from(this.childNodes);
      this.template.childElementCount,
        parent.removeChild(this.open),
        this.template.append(...ch),
        parent.removeChild(this.close);
    }
  }
  appendChild(node) {
    return this.insertBefore(node, null);
  }
  insertBeforeTo(newParent, child) {
    const ch = Array.from(this.childNodes);
    newParent.insertBefore(this.open, child);
    for (const c of ch) {
      newParent.insertBefore(c, child);
    }
    newParent.insertBefore(this.close, child), this.template.childElementCount;
  }
  appendTo(newParent) {
    this.insertBeforeTo(newParent, null);
  }
  removeChild(child) {
    this.parentElement
      ? this.parentElement.removeChild(child)
      : this.template.removeChild(child);
  }
  getAttribute(prop) {
    var _a2;
    return (_a2 = this.attributes.get(prop)) != null ? _a2 : null;
  }
  hasAttribute(prop) {
    return this.attributes.has(prop);
  }
  setAttribute(prop, value) {
    this.attributes.set(prop, value),
      (this.open.data = updateComment(this.attributes));
  }
  removeAttribute(prop) {
    this.attributes.delete(prop),
      (this.open.data = updateComment(this.attributes));
  }
  matches(_) {
    return false;
  }
  compareDocumentPosition(other) {
    return this.open.compareDocumentPosition(other);
  }
  closest(query) {
    const parent = this.parentElement;
    return parent ? parent.closest(query) : null;
  }
  querySelectorAll(query) {
    const result = [];
    return (
      getChildren(this, "elements").forEach((el) => {
        isQwikElement(el) &&
          (el.matches(query) && result.push(el),
          result.concat(Array.from(el.querySelectorAll(query))));
      }),
      result
    );
  }
  querySelector(query) {
    for (const el of this.childNodes) {
      if (isElement(el)) {
        if (el.matches(query)) {
          return el;
        }
        const v = el.querySelector(query);
        if (null !== v) {
          return v;
        }
      }
    }
    return null;
  }
  get firstChild() {
    if (this.parentElement) {
      const first = this.open.nextSibling;
      return first === this.close ? null : first;
    }
    return this.template.firstChild;
  }
  get nextSibling() {
    return this.close.nextSibling;
  }
  get previousSibling() {
    return this.open.previousSibling;
  }
  get childNodes() {
    if (!this.parentElement) {
      return this.template.childNodes;
    }
    const nodes = [];
    let node = this.open;
    for (; (node = node.nextSibling) && node !== this.close; ) {
      nodes.push(node);
    }
    return nodes;
  }
  get isConnected() {
    return this.open.isConnected;
  }
  get parentElement() {
    return this.open.parentElement;
  }
}
const updateComment = (attributes) =>
  `qv ${((map) => {
    const attributes2 = [];
    return (
      map.forEach((value, key) => {
        var s;
        value
          ? attributes2.push(`${key}=${((s = value), s.replace(/ /g, "+"))}`)
          : attributes2.push(`${key}`);
      }),
      attributes2.join(" ")
    );
  })(attributes)}`;
const processVirtualNodes = (node) => {
  if (null == node) {
    return null;
  }
  if (isComment(node)) {
    const virtual = getVirtualElement(node);
    if (virtual) {
      return virtual;
    }
  }
  return node;
};
const getVirtualElement = (open) => {
  const virtual = open.__virtual;
  if (virtual) {
    return virtual;
  }
  if (open.data.startsWith("qv ")) {
    const close = findClose(open);
    return new VirtualElementImpl(open, close);
  }
  return null;
};
const findClose = (open) => {
  let node = open.nextSibling;
  let stack = 1;
  for (; node; ) {
    if (isComment(node)) {
      if (node.data.startsWith("qv ")) {
        stack++;
      } else if ("/qv" === node.data && (stack--, 0 === stack)) {
        return node;
      }
    }
    node = node.nextSibling;
  }
  throw new Error("close not found");
};
const isComment = (node) => 8 === node.nodeType;
const getRootNode = (node) =>
  null == node ? null : isVirtualElement(node) ? node.open : node;
const createContext$1 = (name) =>
  Object.freeze({
    id: fromCamelToKebabCase(name),
  });
const useContextProvider = (context, newValue) => {
  const { get, set, ctx } = useSequentialScope();
  if (void 0 !== get) {
    return;
  }
  const hostElement = ctx.$hostElement$;
  const hostCtx = getContext(hostElement);
  let contexts = hostCtx.$contexts$;
  contexts || (hostCtx.$contexts$ = contexts = /* @__PURE__ */ new Map()),
    contexts.set(context.id, newValue),
    set(true);
};
const useContext = (context, defaultValue) => {
  const { get, set, ctx } = useSequentialScope();
  if (void 0 !== get) {
    return get;
  }
  const value = resolveContext(context, ctx.$hostElement$, ctx.$renderCtx$);
  if (void 0 !== value) {
    return set(value);
  }
  if (void 0 !== defaultValue) {
    return set(defaultValue);
  }
  throw qError(QError_notFoundContext, context.id);
};
const resolveContext = (context, hostElement, rctx) => {
  const contextID = context.id;
  if (rctx) {
    const contexts = rctx.$localStack$;
    for (let i = contexts.length - 1; i >= 0; i--) {
      const ctx = contexts[i];
      if (((hostElement = ctx.$element$), ctx.$contexts$)) {
        const found = ctx.$contexts$.get(contextID);
        if (found) {
          return found;
        }
      }
    }
  }
  if (hostElement.closest) {
    const value = queryContextFromDom(hostElement, contextID);
    if (void 0 !== value) {
      return value;
    }
  }
};
const queryContextFromDom = (hostElement, contextId) => {
  var _a2;
  let element = hostElement;
  for (; element; ) {
    let node = element;
    let virtual;
    for (; node && (virtual = findVirtual(node)); ) {
      const contexts =
        (_a2 = tryGetContext(virtual)) == null ? void 0 : _a2.$contexts$;
      if (contexts && contexts.has(contextId)) {
        return contexts.get(contextId);
      }
      node = virtual;
    }
    element = element.parentElement;
  }
};
const findVirtual = (el) => {
  let node = el;
  let stack = 1;
  for (; (node = node.previousSibling); ) {
    if (isComment(node)) {
      if ("/qv" === node.data) {
        stack++;
      } else if (node.data.startsWith("qv ") && (stack--, 0 === stack)) {
        return getVirtualElement(node);
      }
    }
  }
  return null;
};
const ERROR_CONTEXT = createContext$1("qk-error");
const handleError = (err, hostElement, rctx) => {
  if (isServer$1()) {
    throw err;
  }
  {
    const errorStore = resolveContext(ERROR_CONTEXT, hostElement, rctx);
    if (void 0 === errorStore) {
      throw err;
    }
    errorStore.error = err;
  }
};
const executeComponent = (rctx, elCtx) => {
  (elCtx.$dirty$ = false), (elCtx.$mounted$ = true), (elCtx.$slots$ = []);
  const hostElement = elCtx.$element$;
  const onRenderQRL = elCtx.$renderQrl$;
  const props = elCtx.$props$;
  const newCtx = pushRenderContext(rctx, elCtx);
  const invocatinContext = newInvokeContext(hostElement, void 0, "qRender");
  const waitOn = (invocatinContext.$waitOn$ = []);
  (newCtx.$cmpCtx$ = elCtx),
    (invocatinContext.$subscriber$ = hostElement),
    (invocatinContext.$renderCtx$ = rctx),
    onRenderQRL.$setContainer$(rctx.$static$.$containerState$.$containerEl$);
  const onRenderFn = onRenderQRL.getFn(invocatinContext);
  return safeCall(
    () => onRenderFn(props),
    (jsxNode) => (
      (elCtx.$attachedListeners$ = false),
      waitOn.length > 0
        ? Promise.all(waitOn).then(() =>
            elCtx.$dirty$
              ? executeComponent(rctx, elCtx)
              : {
                  node: jsxNode,
                  rctx: newCtx,
                }
          )
        : elCtx.$dirty$
        ? executeComponent(rctx, elCtx)
        : {
            node: jsxNode,
            rctx: newCtx,
          }
    ),
    (err) => (
      handleError(err, hostElement, rctx),
      {
        node: SkipRender,
        rctx: newCtx,
      }
    )
  );
};
const createRenderContext = (doc, containerState) => ({
  $static$: {
    $doc$: doc,
    $containerState$: containerState,
    $hostElements$: /* @__PURE__ */ new Set(),
    $operations$: [],
    $postOperations$: [],
    $roots$: [],
    $addSlots$: [],
    $rmSlots$: [],
  },
  $cmpCtx$: void 0,
  $localStack$: [],
});
const pushRenderContext = (ctx, elCtx) => ({
  $static$: ctx.$static$,
  $cmpCtx$: ctx.$cmpCtx$,
  $localStack$: ctx.$localStack$.concat(elCtx),
});
const serializeClass = (obj) => {
  if (isString(obj)) {
    return obj;
  }
  if (isObject(obj)) {
    if (isArray(obj)) {
      return obj.join(" ");
    }
    {
      let buffer = "";
      let previous = false;
      for (const key of Object.keys(obj)) {
        obj[key] &&
          (previous && (buffer += " "), (buffer += key), (previous = true));
      }
      return buffer;
    }
  }
  return "";
};
const parseClassListRegex = /\s/;
const parseClassList = (value) =>
  value ? value.split(parseClassListRegex) : EMPTY_ARRAY$1;
const stringifyStyle = (obj) => {
  if (null == obj) {
    return "";
  }
  if ("object" == typeof obj) {
    if (isArray(obj)) {
      throw qError(QError_stringifyClassOrStyle, obj, "style");
    }
    {
      const chunks = [];
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          value && chunks.push(fromCamelToKebabCase(key) + ":" + value);
        }
      }
      return chunks.join(";");
    }
  }
  return String(obj);
};
const getNextIndex = (ctx) =>
  intToStr(ctx.$static$.$containerState$.$elementIndex$++);
const setQId = (rctx, ctx) => {
  const id = getNextIndex(rctx);
  (ctx.$id$ = id), ctx.$element$.setAttribute("q:id", id);
};
const SKIPS_PROPS = [QSlot, "q:renderFn", "children"];
const serializeSStyle = (scopeIds) => {
  const value = scopeIds.join(" ");
  if (value.length > 0) {
    return value;
  }
};
const renderComponent = (rctx, ctx, flags) => {
  const justMounted = !ctx.$mounted$;
  const hostElement = ctx.$element$;
  const containerState = rctx.$static$.$containerState$;
  return (
    containerState.$hostsStaging$.delete(hostElement),
    containerState.$subsManager$.$clearSub$(hostElement),
    then(executeComponent(rctx, ctx), (res) => {
      const staticCtx = rctx.$static$;
      const newCtx = res.rctx;
      const invocatinContext = newInvokeContext(hostElement);
      if (
        (staticCtx.$hostElements$.add(hostElement),
        (invocatinContext.$subscriber$ = hostElement),
        (invocatinContext.$renderCtx$ = newCtx),
        justMounted)
      ) {
        if (ctx.$appendStyles$) {
          for (const style of ctx.$appendStyles$) {
            appendHeadStyle(staticCtx, style);
          }
        }
        if (ctx.$scopeIds$) {
          const value = serializeSStyle(ctx.$scopeIds$);
          value && hostElement.setAttribute("q:sstyle", value);
        }
      }
      const processedJSXNode = processData$1(res.node, invocatinContext);
      return then(processedJSXNode, (processedJSXNode2) => {
        const newVdom = wrapJSX(hostElement, processedJSXNode2);
        const oldVdom = getVdom(ctx);
        return then(visitJsxNode(newCtx, oldVdom, newVdom, flags), () => {
          ctx.$vdom$ = newVdom;
        });
      });
    })
  );
};
const getVdom = (ctx) => (
  ctx.$vdom$ || (ctx.$vdom$ = domToVnode(ctx.$element$)), ctx.$vdom$
);
class ProcessedJSXNodeImpl {
  constructor($type$, $props$, $children$, $key$) {
    (this.$type$ = $type$),
      (this.$props$ = $props$),
      (this.$children$ = $children$),
      (this.$key$ = $key$),
      (this.$elm$ = null),
      (this.$text$ = "");
  }
}
const wrapJSX = (element, input) => {
  const children =
    void 0 === input ? EMPTY_ARRAY$1 : isArray(input) ? input : [input];
  const node = new ProcessedJSXNodeImpl(":virtual", {}, children, null);
  return (node.$elm$ = element), node;
};
const processData$1 = (node, invocationContext) => {
  if (null != node && "boolean" != typeof node) {
    if (isString(node) || "number" == typeof node) {
      const newNode = new ProcessedJSXNodeImpl(
        "#text",
        EMPTY_OBJ$1,
        EMPTY_ARRAY$1,
        null
      );
      return (newNode.$text$ = String(node)), newNode;
    }
    if (isJSXNode(node)) {
      return ((node2, invocationContext2) => {
        const key = null != node2.key ? String(node2.key) : null;
        const nodeType = node2.type;
        const props = node2.props;
        const originalChildren = props.children;
        let textType = "";
        if (isString(nodeType)) {
          textType = nodeType;
        } else {
          if (nodeType !== Virtual) {
            if (isFunction(nodeType)) {
              const res = invoke(
                invocationContext2,
                nodeType,
                props,
                node2.key
              );
              return processData$1(res, invocationContext2);
            }
            throw qError(QError_invalidJsxNodeType, nodeType);
          }
          textType = ":virtual";
        }
        let children = EMPTY_ARRAY$1;
        return null != originalChildren
          ? then(
              processData$1(originalChildren, invocationContext2),
              (result) => (
                void 0 !== result &&
                  (children = isArray(result) ? result : [result]),
                new ProcessedJSXNodeImpl(textType, props, children, key)
              )
            )
          : new ProcessedJSXNodeImpl(textType, props, children, key);
      })(node, invocationContext);
    }
    if (isArray(node)) {
      const output = promiseAll(
        node.flatMap((n) => processData$1(n, invocationContext))
      );
      return then(output, (array) => array.flat(100).filter(isNotNullable));
    }
    return isPromise(node)
      ? node.then((node2) => processData$1(node2, invocationContext))
      : node === SkipRender
      ? new ProcessedJSXNodeImpl(
          ":skipRender",
          EMPTY_OBJ$1,
          EMPTY_ARRAY$1,
          null
        )
      : void logWarn(
          "A unsupported value was passed to the JSX, skipping render. Value:",
          node
        );
  }
};
const SVG_NS = "http://www.w3.org/2000/svg";
const CHILDREN_PLACEHOLDER = [];
const visitJsxNode = (ctx, oldVnode, newVnode, flags) =>
  smartUpdateChildren(ctx, oldVnode, newVnode, "root", flags);
const smartUpdateChildren = (ctx, oldVnode, newVnode, mode, flags) => {
  oldVnode.$elm$;
  const ch = newVnode.$children$;
  if (1 === ch.length && ":skipRender" === ch[0].$type$) {
    return;
  }
  const elm = oldVnode.$elm$;
  oldVnode.$children$ === CHILDREN_PLACEHOLDER &&
    "HEAD" === elm.nodeName &&
    ((mode = "head"), (flags |= 2));
  const oldCh = getVnodeChildren(oldVnode, mode);
  return oldCh.length > 0 && ch.length > 0
    ? updateChildren(ctx, elm, oldCh, ch, flags)
    : ch.length > 0
    ? addVnodes(ctx, elm, null, ch, 0, ch.length - 1, flags)
    : oldCh.length > 0
    ? removeVnodes(ctx.$static$, oldCh, 0, oldCh.length - 1)
    : void 0;
};
const getVnodeChildren = (vnode, mode) => {
  const oldCh = vnode.$children$;
  const elm = vnode.$elm$;
  return oldCh === CHILDREN_PLACEHOLDER
    ? (vnode.$children$ = getChildrenVnodes(elm, mode))
    : oldCh;
};
const updateChildren = (ctx, parentElm, oldCh, newCh, flags) => {
  let oldStartIdx = 0;
  let newStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;
  let oldStartVnode = oldCh[0];
  let oldEndVnode = oldCh[oldEndIdx];
  let newEndIdx = newCh.length - 1;
  let newStartVnode = newCh[0];
  let newEndVnode = newCh[newEndIdx];
  let oldKeyToIdx;
  let idxInOld;
  let elmToMove;
  const results = [];
  const staticCtx = ctx.$static$;
  for (; oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx; ) {
    if (null == oldStartVnode) {
      oldStartVnode = oldCh[++oldStartIdx];
    } else if (null == oldEndVnode) {
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (null == newStartVnode) {
      newStartVnode = newCh[++newStartIdx];
    } else if (null == newEndVnode) {
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      results.push(patchVnode(ctx, oldStartVnode, newStartVnode, flags)),
        (oldStartVnode = oldCh[++oldStartIdx]),
        (newStartVnode = newCh[++newStartIdx]);
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      results.push(patchVnode(ctx, oldEndVnode, newEndVnode, flags)),
        (oldEndVnode = oldCh[--oldEndIdx]),
        (newEndVnode = newCh[--newEndIdx]);
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      oldStartVnode.$elm$,
        oldEndVnode.$elm$,
        results.push(patchVnode(ctx, oldStartVnode, newEndVnode, flags)),
        insertBefore(
          staticCtx,
          parentElm,
          oldStartVnode.$elm$,
          oldEndVnode.$elm$.nextSibling
        ),
        (oldStartVnode = oldCh[++oldStartIdx]),
        (newEndVnode = newCh[--newEndIdx]);
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      oldStartVnode.$elm$,
        oldEndVnode.$elm$,
        results.push(patchVnode(ctx, oldEndVnode, newStartVnode, flags)),
        insertBefore(
          staticCtx,
          parentElm,
          oldEndVnode.$elm$,
          oldStartVnode.$elm$
        ),
        (oldEndVnode = oldCh[--oldEndIdx]),
        (newStartVnode = newCh[++newStartIdx]);
    } else {
      if (
        (void 0 === oldKeyToIdx &&
          (oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)),
        (idxInOld = oldKeyToIdx[newStartVnode.$key$]),
        void 0 === idxInOld)
      ) {
        const newElm = createElm(ctx, newStartVnode, flags);
        results.push(
          then(newElm, (newElm2) => {
            insertBefore(staticCtx, parentElm, newElm2, oldStartVnode.$elm$);
          })
        );
      } else if (
        ((elmToMove = oldCh[idxInOld]),
        isTagName(elmToMove, newStartVnode.$type$))
      ) {
        results.push(patchVnode(ctx, elmToMove, newStartVnode, flags)),
          (oldCh[idxInOld] = void 0),
          elmToMove.$elm$,
          insertBefore(
            staticCtx,
            parentElm,
            elmToMove.$elm$,
            oldStartVnode.$elm$
          );
      } else {
        const newElm = createElm(ctx, newStartVnode, flags);
        results.push(
          then(newElm, (newElm2) => {
            insertBefore(staticCtx, parentElm, newElm2, oldStartVnode.$elm$);
          })
        );
      }
      newStartVnode = newCh[++newStartIdx];
    }
  }
  if (newStartIdx <= newEndIdx) {
    const before =
      null == newCh[newEndIdx + 1] ? null : newCh[newEndIdx + 1].$elm$;
    results.push(
      addVnodes(ctx, parentElm, before, newCh, newStartIdx, newEndIdx, flags)
    );
  }
  let wait = promiseAll(results);
  return (
    oldStartIdx <= oldEndIdx &&
      (wait = then(wait, () => {
        removeVnodes(staticCtx, oldCh, oldStartIdx, oldEndIdx);
      })),
    wait
  );
};
const getCh = (elm, filter) => {
  const end = isVirtualElement(elm) ? elm.close : null;
  const nodes = [];
  let node = elm.firstChild;
  for (
    ;
    (node = processVirtualNodes(node)) &&
    (filter(node) && nodes.push(node), (node = node.nextSibling), node !== end);

  ) {}
  return nodes;
};
const getChildren = (elm, mode) => {
  switch (mode) {
    case "root":
      return getCh(elm, isChildComponent);
    case "head":
      return getCh(elm, isHeadChildren);
    case "elements":
      return getCh(elm, isQwikElement);
  }
};
const getChildrenVnodes = (elm, mode) =>
  getChildren(elm, mode).map(getVnodeFromEl);
const getVnodeFromEl = (el) => {
  var _a2, _b;
  return isElement(el)
    ? (_b = (_a2 = tryGetContext(el)) == null ? void 0 : _a2.$vdom$) != null
      ? _b
      : domToVnode(el)
    : domToVnode(el);
};
const domToVnode = (node) => {
  if (isQwikElement(node)) {
    const props = isVirtualElement(node) ? EMPTY_OBJ$1 : getProps(node);
    const t = new ProcessedJSXNodeImpl(
      node.localName,
      props,
      CHILDREN_PLACEHOLDER,
      getKey(node)
    );
    return (t.$elm$ = node), t;
  }
  if (3 === node.nodeType) {
    const t = new ProcessedJSXNodeImpl(
      node.nodeName,
      {},
      CHILDREN_PLACEHOLDER,
      null
    );
    return (t.$text$ = node.data), (t.$elm$ = node), t;
  }
  throw new Error("invalid node");
};
const getProps = (node) => {
  const props = {};
  const attributes = node.attributes;
  const len = attributes.length;
  for (let i = 0; i < len; i++) {
    const attr = attributes.item(i);
    const name = attr.name;
    name.includes(":") ||
      (props[name] = "class" === name ? parseDomClass(attr.value) : attr.value);
  }
  return props;
};
const parseDomClass = (value) =>
  parseClassList(value)
    .filter((c) => !c.startsWith("\u2B50\uFE0F"))
    .join(" ");
const isHeadChildren = (node) => {
  const type = node.nodeType;
  return 1 === type ? node.hasAttribute("q:head") : 111 === type;
};
const isSlotTemplate = (node) => "Q:TEMPLATE" === node.nodeName;
const isChildComponent = (node) => {
  const type = node.nodeType;
  if (3 === type || 111 === type) {
    return true;
  }
  if (1 !== type) {
    return false;
  }
  const nodeName = node.nodeName;
  return (
    "Q:TEMPLATE" !== nodeName &&
    ("HEAD" !== nodeName || node.hasAttribute("q:head"))
  );
};
const patchVnode = (rctx, oldVnode, newVnode, flags) => {
  oldVnode.$type$, newVnode.$type$;
  const elm = oldVnode.$elm$;
  const tag = newVnode.$type$;
  const staticCtx = rctx.$static$;
  const isVirtual = ":virtual" === tag;
  if (((newVnode.$elm$ = elm), "#text" === tag)) {
    return void (
      oldVnode.$text$ !== newVnode.$text$ &&
      setProperty(staticCtx, elm, "data", newVnode.$text$)
    );
  }
  let isSvg = !!(1 & flags);
  isSvg || "svg" !== tag || ((flags |= 1), (isSvg = true));
  const props = newVnode.$props$;
  const isComponent = isVirtual && "q:renderFn" in props;
  const elCtx = getContext(elm);
  if (!isComponent) {
    const listenerMap = updateProperties(
      elCtx,
      staticCtx,
      oldVnode.$props$,
      props,
      isSvg
    );
    const currentComponent = rctx.$cmpCtx$;
    if (currentComponent && !currentComponent.$attachedListeners$) {
      currentComponent.$attachedListeners$ = true;
      for (const key of Object.keys(currentComponent.li)) {
        addQRLListener(listenerMap, key, currentComponent.li[key]),
          addGlobalListener(staticCtx, elm, key);
      }
    }
    for (const key of Object.keys(listenerMap)) {
      setAttribute(staticCtx, elm, key, serializeQRLs(listenerMap[key], elCtx));
    }
    if (
      (isSvg &&
        "foreignObject" === newVnode.$type$ &&
        ((flags &= -2), (isSvg = false)),
      isVirtual && "q:s" in props)
    ) {
      const currentComponent2 = rctx.$cmpCtx$;
      return (
        currentComponent2.$slots$, void currentComponent2.$slots$.push(newVnode)
      );
    }
    if (void 0 !== props[dangerouslySetInnerHTML]) {
      return;
    }
    if (isVirtual && "qonce" in props) {
      return;
    }
    return smartUpdateChildren(rctx, oldVnode, newVnode, "root", flags);
  }
  let needsRender = setComponentProps$1(elCtx, rctx, props);
  return (
    needsRender ||
      elCtx.$renderQrl$ ||
      elCtx.$element$.hasAttribute("q:id") ||
      (setQId(rctx, elCtx),
      (elCtx.$renderQrl$ = props["q:renderFn"]),
      elCtx.$renderQrl$,
      (needsRender = true)),
    needsRender
      ? then(renderComponent(rctx, elCtx, flags), () =>
          renderContentProjection(rctx, elCtx, newVnode, flags)
        )
      : renderContentProjection(rctx, elCtx, newVnode, flags)
  );
};
const renderContentProjection = (rctx, hostCtx, vnode, flags) => {
  const newChildren = vnode.$children$;
  const staticCtx = rctx.$static$;
  const splittedNewChidren = ((input) => {
    var _a2;
    const output = {};
    for (const item of input) {
      const key = getSlotName(item);
      ((_a2 = output[key]) != null
        ? _a2
        : (output[key] = new ProcessedJSXNodeImpl(
            ":virtual",
            {
              "q:s": "",
            },
            [],
            key
          ))
      ).$children$.push(item);
    }
    return output;
  })(newChildren);
  const slotRctx = pushRenderContext(rctx, hostCtx);
  const slotMaps = getSlotMap(hostCtx);
  for (const key of Object.keys(slotMaps.slots)) {
    if (!splittedNewChidren[key]) {
      const slotEl = slotMaps.slots[key];
      const oldCh = getChildrenVnodes(slotEl, "root");
      if (oldCh.length > 0) {
        const slotCtx = tryGetContext(slotEl);
        slotCtx && slotCtx.$vdom$ && (slotCtx.$vdom$.$children$ = []),
          removeVnodes(staticCtx, oldCh, 0, oldCh.length - 1);
      }
    }
  }
  for (const key of Object.keys(slotMaps.templates)) {
    const templateEl = slotMaps.templates[key];
    templateEl &&
      ((splittedNewChidren[key] && !slotMaps.slots[key]) ||
        (removeNode(staticCtx, templateEl),
        (slotMaps.templates[key] = void 0)));
  }
  return promiseAll(
    Object.keys(splittedNewChidren).map((key) => {
      const newVdom = splittedNewChidren[key];
      const slotElm = getSlotElement(
        staticCtx,
        slotMaps,
        hostCtx.$element$,
        key
      );
      const slotCtx = getContext(slotElm);
      const oldVdom = getVdom(slotCtx);
      return (
        (slotCtx.$vdom$ = newVdom),
        (newVdom.$elm$ = slotElm),
        smartUpdateChildren(slotRctx, oldVdom, newVdom, "root", flags)
      );
    })
  );
};
const addVnodes = (ctx, parentElm, before, vnodes, startIdx, endIdx, flags) => {
  const promises = [];
  let hasPromise = false;
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = vnodes[startIdx];
    const elm = createElm(ctx, ch, flags);
    promises.push(elm), isPromise(elm) && (hasPromise = true);
  }
  if (hasPromise) {
    return Promise.all(promises).then((children) =>
      insertChildren(ctx.$static$, parentElm, children, before)
    );
  }
  insertChildren(ctx.$static$, parentElm, promises, before);
};
const insertChildren = (ctx, parentElm, children, before) => {
  for (const child of children) {
    insertBefore(ctx, parentElm, child, before);
  }
};
const removeVnodes = (ctx, nodes, startIdx, endIdx) => {
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = nodes[startIdx];
    ch && (ch.$elm$, removeNode(ctx, ch.$elm$));
  }
};
const getSlotElement = (ctx, slotMaps, parentEl, slotName) => {
  const slotEl = slotMaps.slots[slotName];
  if (slotEl) {
    return slotEl;
  }
  const templateEl = slotMaps.templates[slotName];
  if (templateEl) {
    return templateEl;
  }
  const template = createTemplate(ctx.$doc$, slotName);
  return (
    ((ctx2, parent, newChild) => {
      ctx2.$operations$.push({
        $operation$: directInsertBefore,
        $args$: [parent, newChild, parent.firstChild],
      });
    })(ctx, parentEl, template),
    (slotMaps.templates[slotName] = template),
    template
  );
};
const getSlotName = (node) => {
  var _a2;
  return (_a2 = node.$props$[QSlot]) != null ? _a2 : "";
};
const createElm = (rctx, vnode, flags) => {
  const tag = vnode.$type$;
  const doc = rctx.$static$.$doc$;
  if ("#text" === tag) {
    return (vnode.$elm$ = ((doc2, text) => doc2.createTextNode(text))(
      doc,
      vnode.$text$
    ));
  }
  let elm;
  let isHead = !!(2 & flags);
  let isSvg = !!(1 & flags);
  isSvg || "svg" !== tag || ((flags |= 1), (isSvg = true));
  const isVirtual = ":virtual" === tag;
  const props = vnode.$props$;
  const isComponent = "q:renderFn" in props;
  const staticCtx = rctx.$static$;
  isVirtual
    ? (elm = ((doc2) => {
        const open = doc2.createComment("qv ");
        const close = doc2.createComment("/qv");
        return new VirtualElementImpl(open, close);
      })(doc))
    : "head" === tag
    ? ((elm = doc.head), (flags |= 2), (isHead = true))
    : ((elm = createElement(doc, tag, isSvg)), (flags &= -3)),
    (vnode.$elm$ = elm),
    isSvg && "foreignObject" === tag && ((isSvg = false), (flags &= -2));
  const elCtx = getContext(elm);
  if (isComponent) {
    setKey(elm, vnode.$key$);
    const renderQRL = props["q:renderFn"];
    return (
      setComponentProps$1(elCtx, rctx, props),
      setQId(rctx, elCtx),
      (elCtx.$renderQrl$ = renderQRL),
      then(renderComponent(rctx, elCtx, flags), () => {
        let children2 = vnode.$children$;
        if (0 === children2.length) {
          return elm;
        }
        1 === children2.length &&
          ":skipRender" === children2[0].$type$ &&
          (children2 = children2[0].$children$);
        const slotRctx = pushRenderContext(rctx, elCtx);
        const slotMap = getSlotMap(elCtx);
        const elements = children2.map((ch) => createElm(slotRctx, ch, flags));
        return then(promiseAll(elements), () => {
          for (const node of children2) {
            node.$elm$,
              appendChild(
                staticCtx,
                getSlotElement(staticCtx, slotMap, elm, getSlotName(node)),
                node.$elm$
              );
          }
          return elm;
        });
      })
    );
  }
  const currentComponent = rctx.$cmpCtx$;
  const isSlot = isVirtual && "q:s" in props;
  const hasRef = !isVirtual && "ref" in props;
  const listenerMap = setProperties(staticCtx, elCtx, props, isSvg);
  if (currentComponent && !isVirtual) {
    const scopedIds = currentComponent.$scopeIds$;
    if (
      (scopedIds &&
        scopedIds.forEach((styleId) => {
          elm.classList.add(styleId);
        }),
      !currentComponent.$attachedListeners$)
    ) {
      currentComponent.$attachedListeners$ = true;
      for (const eventName of Object.keys(currentComponent.li)) {
        addQRLListener(listenerMap, eventName, currentComponent.li[eventName]);
      }
    }
  }
  isSlot
    ? (currentComponent.$slots$,
      setKey(elm, vnode.$key$),
      directSetAttribute(elm, "q:sref", currentComponent.$id$),
      currentComponent.$slots$.push(vnode),
      staticCtx.$addSlots$.push([elm, currentComponent.$element$]))
    : setKey(elm, vnode.$key$);
  {
    const listeners = Object.keys(listenerMap);
    isHead && !isVirtual && directSetAttribute(elm, "q:head", ""),
      (listeners.length > 0 || hasRef) && setQId(rctx, elCtx);
    for (const key of listeners) {
      setAttribute(staticCtx, elm, key, serializeQRLs(listenerMap[key], elCtx));
    }
  }
  if (void 0 !== props[dangerouslySetInnerHTML]) {
    return elm;
  }
  let children = vnode.$children$;
  if (0 === children.length) {
    return elm;
  }
  1 === children.length &&
    ":skipRender" === children[0].$type$ &&
    (children = children[0].$children$);
  const promises = children.map((ch) => createElm(rctx, ch, flags));
  return then(promiseAll(promises), () => {
    for (const node of children) {
      node.$elm$, appendChild(rctx.$static$, elm, node.$elm$);
    }
    return elm;
  });
};
const getSlotMap = (ctx) => {
  var _a2, _b;
  const slotsArray = ((ctx2) =>
    ctx2.$slots$ ||
    (ctx2.$element$.parentElement, (ctx2.$slots$ = readDOMSlots(ctx2))))(ctx);
  const slots = {};
  const templates = {};
  const t = Array.from(ctx.$element$.childNodes).filter(isSlotTemplate);
  for (const vnode of slotsArray) {
    vnode.$elm$, (slots[(_a2 = vnode.$key$) != null ? _a2 : ""] = vnode.$elm$);
  }
  for (const elm of t) {
    templates[(_b = directGetAttribute(elm, QSlot)) != null ? _b : ""] = elm;
  }
  return {
    slots,
    templates,
  };
};
const readDOMSlots = (ctx) =>
  ((el, prop, value) => {
    const walker = ((el2, prop2, value2) =>
      el2.ownerDocument.createTreeWalker(el2, 128, {
        acceptNode(c) {
          const virtual = getVirtualElement(c);
          return virtual && directGetAttribute(virtual, "q:sref") === value2
            ? 1
            : 2;
        },
      }))(el, 0, value);
    const pars = [];
    let currentNode = null;
    for (; (currentNode = walker.nextNode()); ) {
      pars.push(getVirtualElement(currentNode));
    }
    return pars;
  })(ctx.$element$.parentElement, 0, ctx.$id$).map(domToVnode);
const checkBeforeAssign = (ctx, elm, prop, newValue) => (
  prop in elm &&
    elm[prop] !== newValue &&
    setProperty(ctx, elm, prop, newValue),
  true
);
const dangerouslySetInnerHTML = "dangerouslySetInnerHTML";
const PROP_HANDLER_MAP = {
  style: (ctx, elm, _, newValue) => (
    setProperty(ctx, elm.style, "cssText", stringifyStyle(newValue)), true
  ),
  class: (ctx, elm, _, newValue, oldValue) => {
    const oldClasses = parseClassList(oldValue);
    const newClasses = parseClassList(newValue);
    return (
      ((ctx2, elm2, toRemove, toAdd) => {
        ctx2
          ? ctx2.$operations$.push({
              $operation$: _setClasslist,
              $args$: [elm2, toRemove, toAdd],
            })
          : _setClasslist(elm2, toRemove, toAdd);
      })(
        ctx,
        elm,
        oldClasses.filter((c) => c && !newClasses.includes(c)),
        newClasses.filter((c) => c && !oldClasses.includes(c))
      ),
      true
    );
  },
  value: checkBeforeAssign,
  checked: checkBeforeAssign,
  [dangerouslySetInnerHTML]: (ctx, elm, _, newValue) => (
    dangerouslySetInnerHTML in elm
      ? setProperty(ctx, elm, dangerouslySetInnerHTML, newValue)
      : "innerHTML" in elm && setProperty(ctx, elm, "innerHTML", newValue),
    true
  ),
  innerHTML: () => true,
};
const updateProperties = (elCtx, staticCtx, oldProps, newProps, isSvg) => {
  const keys = getKeys(oldProps, newProps);
  const listenersMap = (elCtx.li = {});
  if (0 === keys.length) {
    return listenersMap;
  }
  const elm = elCtx.$element$;
  for (let key of keys) {
    if ("children" === key) {
      continue;
    }
    let newValue = newProps[key];
    "className" === key && ((newProps.class = newValue), (key = "class")),
      "class" === key && (newProps.class = newValue = serializeClass(newValue));
    const oldValue = oldProps[key];
    if (oldValue === newValue) {
      continue;
    }
    if ("ref" === key) {
      newValue.current = elm;
      continue;
    }
    if (isOnProp(key)) {
      setEvent(listenersMap, key, newValue);
      continue;
    }
    const exception = PROP_HANDLER_MAP[key];
    (exception && exception(staticCtx, elm, key, newValue, oldValue)) ||
      (isSvg || !(key in elm)
        ? setAttribute(staticCtx, elm, key, newValue)
        : setProperty(staticCtx, elm, key, newValue));
  }
  return listenersMap;
};
const getKeys = (oldProps, newProps) => {
  const keys = Object.keys(newProps);
  return (
    keys.push(...Object.keys(oldProps).filter((p) => !keys.includes(p))), keys
  );
};
const addGlobalListener = (staticCtx, elm, prop) => {
  try {
    window.qwikevents && window.qwikevents.push(getEventName(prop));
  } catch (err) {}
};
const setProperties = (rctx, elCtx, newProps, isSvg) => {
  const elm = elCtx.$element$;
  const keys = Object.keys(newProps);
  const listenerMap = elCtx.li;
  if (0 === keys.length) {
    return listenerMap;
  }
  for (let key of keys) {
    if ("children" === key) {
      continue;
    }
    let newValue = newProps[key];
    if (
      ("className" === key && ((newProps.class = newValue), (key = "class")),
      "class" === key && (newProps.class = newValue = serializeClass(newValue)),
      "ref" === key)
    ) {
      newValue.current = elm;
      continue;
    }
    if (isOnProp(key)) {
      addGlobalListener(rctx, elm, setEvent(listenerMap, key, newValue));
      continue;
    }
    const exception = PROP_HANDLER_MAP[key];
    (exception && exception(rctx, elm, key, newValue, void 0)) ||
      (isSvg || !(key in elm)
        ? setAttribute(rctx, elm, key, newValue)
        : setProperty(rctx, elm, key, newValue));
  }
  return listenerMap;
};
const setComponentProps$1 = (ctx, rctx, expectProps) => {
  const keys = Object.keys(expectProps);
  if (0 === keys.length) {
    return false;
  }
  const qwikProps = getPropsMutator(ctx, rctx.$static$.$containerState$);
  for (const key of keys) {
    SKIPS_PROPS.includes(key) || qwikProps.set(key, expectProps[key]);
  }
  return ctx.$dirty$;
};
const cleanupTree = (parent, rctx, subsManager, stopSlots) => {
  if (stopSlots && parent.hasAttribute("q:s")) {
    return void rctx.$rmSlots$.push(parent);
  }
  cleanupElement(parent, subsManager);
  const ch = getChildren(parent, "elements");
  for (const child of ch) {
    cleanupTree(child, rctx, subsManager, stopSlots);
  }
};
const cleanupElement = (el, subsManager) => {
  const ctx = tryGetContext(el);
  ctx && cleanupContext(ctx, subsManager);
};
const directAppendChild = (parent, child) => {
  isVirtualElement(child) ? child.appendTo(parent) : parent.appendChild(child);
};
const directRemoveChild = (parent, child) => {
  isVirtualElement(child) ? child.remove() : parent.removeChild(child);
};
const directInsertBefore = (parent, child, ref) => {
  isVirtualElement(child)
    ? child.insertBeforeTo(parent, getRootNode(ref))
    : parent.insertBefore(child, getRootNode(ref));
};
const createKeyToOldIdx = (children, beginIdx, endIdx) => {
  const map = {};
  for (let i = beginIdx; i <= endIdx; ++i) {
    const key = children[i].$key$;
    null != key && (map[key] = i);
  }
  return map;
};
const sameVnode = (vnode1, vnode2) =>
  vnode1.$type$ === vnode2.$type$ && vnode1.$key$ === vnode2.$key$;
const isTagName = (elm, tagName) => elm.$type$ === tagName;
const useLexicalScope = () => {
  const context = getInvokeContext();
  let qrl = context.$qrl$;
  if (qrl) {
    qrl.$captureRef$;
  } else {
    const el = context.$element$;
    const container = getWrappingContainer(el);
    const ctx = getContext(el);
    (qrl = parseQRL(decodeURIComponent(String(context.$url$)), container)),
      resumeIfNeeded(container),
      inflateQrl(qrl, ctx);
  }
  return qrl.$captureRef$;
};
const notifyWatch = (watch, containerState) => {
  watch.$flags$ & WatchFlagsIsDirty ||
    ((watch.$flags$ |= WatchFlagsIsDirty),
    void 0 !== containerState.$hostsRendering$
      ? (containerState.$renderPromise$,
        containerState.$watchStaging$.add(watch))
      : (containerState.$watchNext$.add(watch), scheduleFrame(containerState)));
};
const scheduleFrame = (containerState) => (
  void 0 === containerState.$renderPromise$ &&
    (containerState.$renderPromise$ = getPlatform().nextTick(() =>
      renderMarked(containerState)
    )),
  containerState.$renderPromise$
);
const _hW = () => {
  const [watch] = useLexicalScope();
  notifyWatch(watch, getContainerState(getWrappingContainer(watch.$el$)));
};
const renderMarked = async (containerState) => {
  const hostsRendering = (containerState.$hostsRendering$ = new Set(
    containerState.$hostsNext$
  ));
  containerState.$hostsNext$.clear(),
    await executeWatchesBefore(containerState),
    containerState.$hostsStaging$.forEach((host) => {
      hostsRendering.add(host);
    }),
    containerState.$hostsStaging$.clear();
  const doc = getDocument(containerState.$containerEl$);
  const renderingQueue = Array.from(hostsRendering);
  sortNodes(renderingQueue);
  const ctx = createRenderContext(doc, containerState);
  const staticCtx = ctx.$static$;
  for (const el of renderingQueue) {
    if (!staticCtx.$hostElements$.has(el)) {
      const elCtx = getContext(el);
      if (elCtx.$renderQrl$) {
        el.isConnected, staticCtx.$roots$.push(elCtx);
        try {
          await renderComponent(ctx, elCtx, getFlags(el.parentElement));
        } catch (err) {
          logError(err);
        }
      }
    }
  }
  return (
    staticCtx.$operations$.push(...staticCtx.$postOperations$),
    0 === staticCtx.$operations$.length
      ? void postRendering(containerState, staticCtx)
      : getPlatform().raf(() => {
          (({ $static$: ctx2 }) => {
            executeDOMRender(ctx2);
          })(ctx),
            postRendering(containerState, staticCtx);
        })
  );
};
const getFlags = (el) => {
  let flags = 0;
  return (
    el &&
      (el.namespaceURI === SVG_NS && (flags |= 1),
      "HEAD" === el.tagName && (flags |= 2)),
    flags
  );
};
const postRendering = async (containerState, ctx) => {
  await executeWatchesAfter(
    containerState,
    (watch, stage) =>
      0 != (watch.$flags$ & WatchFlagsIsEffect) &&
      (!stage || ctx.$hostElements$.has(watch.$el$))
  ),
    containerState.$hostsStaging$.forEach((el) => {
      containerState.$hostsNext$.add(el);
    }),
    containerState.$hostsStaging$.clear(),
    (containerState.$hostsRendering$ = void 0),
    (containerState.$renderPromise$ = void 0),
    containerState.$hostsNext$.size + containerState.$watchNext$.size > 0 &&
      scheduleFrame(containerState);
};
const executeWatchesBefore = async (containerState) => {
  const resourcesPromises = [];
  const containerEl = containerState.$containerEl$;
  const watchPromises = [];
  const isWatch = (watch) => 0 != (watch.$flags$ & WatchFlagsIsWatch);
  const isResourceWatch2 = (watch) =>
    0 != (watch.$flags$ & WatchFlagsIsResource);
  containerState.$watchNext$.forEach((watch) => {
    isWatch(watch) &&
      (watchPromises.push(
        then(watch.$qrl$.$resolveLazy$(containerEl), () => watch)
      ),
      containerState.$watchNext$.delete(watch)),
      isResourceWatch2(watch) &&
        (resourcesPromises.push(
          then(watch.$qrl$.$resolveLazy$(containerEl), () => watch)
        ),
        containerState.$watchNext$.delete(watch));
  });
  do {
    if (
      (containerState.$watchStaging$.forEach((watch) => {
        isWatch(watch)
          ? watchPromises.push(
              then(watch.$qrl$.$resolveLazy$(containerEl), () => watch)
            )
          : isResourceWatch2(watch)
          ? resourcesPromises.push(
              then(watch.$qrl$.$resolveLazy$(containerEl), () => watch)
            )
          : containerState.$watchNext$.add(watch);
      }),
      containerState.$watchStaging$.clear(),
      watchPromises.length > 0)
    ) {
      const watches = await Promise.all(watchPromises);
      sortWatches(watches),
        await Promise.all(
          watches.map((watch) => runSubscriber(watch, containerState))
        ),
        (watchPromises.length = 0);
    }
  } while (containerState.$watchStaging$.size > 0);
  if (resourcesPromises.length > 0) {
    const resources = await Promise.all(resourcesPromises);
    sortWatches(resources),
      resources.forEach((watch) => runSubscriber(watch, containerState));
  }
};
const executeWatchesAfter = async (containerState, watchPred) => {
  const watchPromises = [];
  const containerEl = containerState.$containerEl$;
  containerState.$watchNext$.forEach((watch) => {
    watchPred(watch, false) &&
      (watchPromises.push(
        then(watch.$qrl$.$resolveLazy$(containerEl), () => watch)
      ),
      containerState.$watchNext$.delete(watch));
  });
  do {
    if (
      (containerState.$watchStaging$.forEach((watch) => {
        watchPred(watch, true)
          ? watchPromises.push(
              then(watch.$qrl$.$resolveLazy$(containerEl), () => watch)
            )
          : containerState.$watchNext$.add(watch);
      }),
      containerState.$watchStaging$.clear(),
      watchPromises.length > 0)
    ) {
      const watches = await Promise.all(watchPromises);
      sortWatches(watches),
        await Promise.all(
          watches.map((watch) => runSubscriber(watch, containerState))
        ),
        (watchPromises.length = 0);
    }
  } while (containerState.$watchStaging$.size > 0);
};
const sortNodes = (elements) => {
  elements.sort((a, b) =>
    2 & a.compareDocumentPosition(getRootNode(b)) ? 1 : -1
  );
};
const sortWatches = (watches) => {
  watches.sort((a, b) =>
    a.$el$ === b.$el$
      ? a.$index$ < b.$index$
        ? -1
        : 1
      : 0 != (2 & a.$el$.compareDocumentPosition(getRootNode(b.$el$)))
      ? 1
      : -1
  );
};
const CONTAINER_STATE = Symbol("ContainerState");
const getContainerState = (containerEl) => {
  let set = containerEl[CONTAINER_STATE];
  return (
    set ||
      (containerEl[CONTAINER_STATE] = set = createContainerState(containerEl)),
    set
  );
};
const createContainerState = (containerEl) => {
  const containerState = {
    $containerEl$: containerEl,
    $proxyMap$: /* @__PURE__ */ new WeakMap(),
    $subsManager$: null,
    $watchNext$: /* @__PURE__ */ new Set(),
    $watchStaging$: /* @__PURE__ */ new Set(),
    $hostsNext$: /* @__PURE__ */ new Set(),
    $hostsStaging$: /* @__PURE__ */ new Set(),
    $renderPromise$: void 0,
    $hostsRendering$: void 0,
    $envData$: {},
    $elementIndex$: 0,
    $styleIds$: /* @__PURE__ */ new Set(),
    $mutableProps$: false,
  };
  return (
    (containerState.$subsManager$ = createSubscriptionManager(containerState)),
    containerState
  );
};
const createSubscriptionManager = (containerState) => {
  const objToSubs = /* @__PURE__ */ new Map();
  const subsToObjs = /* @__PURE__ */ new Map();
  const tryGetLocal = (obj) => (getProxyTarget(obj), objToSubs.get(obj));
  const trackSubToObj = (subscriber, map) => {
    let set = subsToObjs.get(subscriber);
    set || subsToObjs.set(subscriber, (set = /* @__PURE__ */ new Set())),
      set.add(map);
  };
  const manager = {
    $tryGetLocal$: tryGetLocal,
    $getLocal$: (obj, initialMap) => {
      let local = tryGetLocal(obj);
      if (local);
      else {
        const map = initialMap || /* @__PURE__ */ new Map();
        map.forEach((_, key) => {
          trackSubToObj(key, map);
        }),
          objToSubs.set(
            obj,
            (local = {
              $subs$: map,
              $addSub$(subscriber, key) {
                if (null == key) {
                  map.set(subscriber, null);
                } else {
                  let sub = map.get(subscriber);
                  void 0 === sub &&
                    map.set(subscriber, (sub = /* @__PURE__ */ new Set())),
                    sub && sub.add(key);
                }
                trackSubToObj(subscriber, map);
              },
              $notifySubs$(key) {
                map.forEach((value, subscriber) => {
                  (null !== value && key && !value.has(key)) ||
                    ((subscriber2, containerState2) => {
                      isQwikElement(subscriber2)
                        ? ((hostElement, containerState3) => {
                            const server = isServer$1();
                            server ||
                              resumeIfNeeded(containerState3.$containerEl$);
                            const ctx = getContext(hostElement);
                            if ((ctx.$renderQrl$, !ctx.$dirty$)) {
                              if (
                                ((ctx.$dirty$ = true),
                                void 0 !== containerState3.$hostsRendering$)
                              ) {
                                containerState3.$renderPromise$,
                                  containerState3.$hostsStaging$.add(
                                    hostElement
                                  );
                              } else {
                                if (server) {
                                  return void logWarn();
                                }
                                containerState3.$hostsNext$.add(hostElement),
                                  scheduleFrame(containerState3);
                              }
                            }
                          })(subscriber2, containerState2)
                        : notifyWatch(subscriber2, containerState2);
                    })(subscriber, containerState);
                });
              },
            })
          );
      }
      return local;
    },
    $clearSub$: (sub) => {
      const subs = subsToObjs.get(sub);
      subs &&
        (subs.forEach((s) => {
          s.delete(sub);
        }),
        subsToObjs.delete(sub),
        subs.clear());
    },
  };
  return manager;
};
const _pauseFromContexts = async (allContexts, containerState) => {
  const collector = createCollector(containerState);
  const listeners = [];
  for (const ctx of allContexts) {
    const el = ctx.$element$;
    const ctxLi = ctx.li;
    for (const key of Object.keys(ctxLi)) {
      for (const qrl of ctxLi[key]) {
        const captured = qrl.$captureRef$;
        if (captured) {
          for (const obj of captured) {
            collectValue(obj, collector, true);
          }
        }
        isElement(el) &&
          listeners.push({
            key,
            qrl,
            el,
            eventName: getEventName(key),
          });
      }
    }
    ctx.$watches$ && collector.$watches$.push(...ctx.$watches$);
  }
  if (0 === listeners.length) {
    return {
      state: {
        ctx: {},
        objs: [],
        subs: [],
      },
      objs: [],
      listeners: [],
      mode: "static",
    };
  }
  let promises;
  for (; (promises = collector.$promises$).length > 0; ) {
    (collector.$promises$ = []), await Promise.allSettled(promises);
  }
  const canRender = collector.$elements$.length > 0;
  if (canRender) {
    for (const element of collector.$elements$) {
      collectElementData(tryGetContext(element), collector);
    }
    for (const ctx of allContexts) {
      if (
        (ctx.$props$ &&
          collectMutableProps(ctx.$element$, ctx.$props$, collector),
        ctx.$contexts$)
      ) {
        for (const item of ctx.$contexts$.values()) {
          collectValue(item, collector, false);
        }
      }
    }
  }
  for (; (promises = collector.$promises$).length > 0; ) {
    (collector.$promises$ = []), await Promise.allSettled(promises);
  }
  const elementToIndex = /* @__PURE__ */ new Map();
  const objs = Array.from(collector.$objSet$.keys());
  const objToId = /* @__PURE__ */ new Map();
  const getElementID = (el) => {
    let id = elementToIndex.get(el);
    return (
      void 0 === id &&
        ((id = ((el2) => {
          const ctx = tryGetContext(el2);
          return ctx ? ctx.$id$ : null;
        })(el)),
        id ? (id = "#" + id) : console.warn("Missing ID", el),
        elementToIndex.set(el, id)),
      id
    );
  };
  const getObjId = (obj) => {
    let suffix = "";
    if ((isMutable(obj) && ((obj = obj.mut), (suffix = "%")), isPromise(obj))) {
      const { value, resolved } = getPromiseValue(obj);
      (obj = value), (suffix += resolved ? "~" : "_");
    }
    if (isObject(obj)) {
      const target = getProxyTarget(obj);
      if (target) {
        (suffix += "!"), (obj = target);
      } else if (isQwikElement(obj)) {
        const elID = getElementID(obj);
        return elID ? elID + suffix : null;
      }
    }
    const id = objToId.get(obj);
    return id ? id + suffix : null;
  };
  const mustGetObjId = (obj) => {
    const key = getObjId(obj);
    if (null === key) {
      throw qError(QError_missingObjectId, obj);
    }
    return key;
  };
  const subsMap = /* @__PURE__ */ new Map();
  objs.forEach((obj) => {
    const proxy = containerState.$proxyMap$.get(obj);
    const flags = getProxyFlags(proxy);
    if (void 0 === flags) {
      return;
    }
    const subsObj = [];
    flags > 0 &&
      subsObj.push({
        subscriber: "$",
        data: flags,
      }),
      getProxySubs(proxy).forEach((set, key) => {
        (isNode(key) &&
          isVirtualElement(key) &&
          !collector.$elements$.includes(key)) ||
          subsObj.push({
            subscriber: key,
            data: set ? Array.from(set) : null,
          });
      }),
      subsObj.length > 0 && subsMap.set(obj, subsObj);
  }),
    objs.sort((a, b) => (subsMap.has(a) ? 0 : 1) - (subsMap.has(b) ? 0 : 1));
  let count = 0;
  for (const obj of objs) {
    objToId.set(obj, intToStr(count)), count++;
  }
  if (collector.$noSerialize$.length > 0) {
    const undefinedID = objToId.get(void 0);
    for (const obj of collector.$noSerialize$) {
      objToId.set(obj, undefinedID);
    }
  }
  const subs = objs
    .map((obj) => {
      const sub = subsMap.get(obj);
      if (!sub) {
        return;
      }
      const subsObj = {};
      return (
        sub.forEach(({ subscriber, data }) => {
          if ("$" === subscriber) {
            subsObj[subscriber] = data;
          } else {
            const id = getObjId(subscriber);
            null !== id && (subsObj[id] = data);
          }
        }),
        subsObj
      );
    })
    .filter(isNotNullable);
  const convertedObjs = objs.map((obj) => {
    if (null === obj) {
      return null;
    }
    const typeObj = typeof obj;
    switch (typeObj) {
      case "undefined":
        return UNDEFINED_PREFIX;
      case "string":
      case "number":
      case "boolean":
        return obj;
      default:
        const value = serializeValue(obj, getObjId, containerState);
        if (void 0 !== value) {
          return value;
        }
        if ("object" === typeObj) {
          if (isArray(obj)) {
            return obj.map(mustGetObjId);
          }
          if (isSerializableObject(obj)) {
            const output = {};
            for (const key of Object.keys(obj)) {
              output[key] = mustGetObjId(obj[key]);
            }
            return output;
          }
        }
    }
    throw qError(QError_verifySerializable, obj);
  });
  const meta = {};
  allContexts.forEach((ctx) => {
    const node = ctx.$element$;
    const ref = ctx.$refMap$;
    const props = ctx.$props$;
    const contexts = ctx.$contexts$;
    const watches = ctx.$watches$;
    const renderQrl = ctx.$renderQrl$;
    const seq = ctx.$seq$;
    const metaValue = {};
    const elementCaptured =
      isVirtualElement(node) && collector.$elements$.includes(node);
    let add = false;
    if (ref.length > 0) {
      const value = ref.map(mustGetObjId).join(" ");
      value && ((metaValue.r = value), (add = true));
    }
    if (canRender) {
      if (
        (elementCaptured &&
          props &&
          ((metaValue.h = mustGetObjId(props) + " " + mustGetObjId(renderQrl)),
          (add = true)),
        watches && watches.length > 0)
      ) {
        const value = watches.map(getObjId).filter(isNotNullable).join(" ");
        value && ((metaValue.w = value), (add = true));
      }
      if (elementCaptured && seq && seq.length > 0) {
        const value = seq.map(mustGetObjId).join(" ");
        (metaValue.s = value), (add = true);
      }
      if (contexts) {
        const serializedContexts = [];
        contexts.forEach((value2, key) => {
          serializedContexts.push(`${key}=${mustGetObjId(value2)}`);
        });
        const value = serializedContexts.join(" ");
        value && ((metaValue.c = value), (add = true));
      }
    }
    if (add) {
      const elementID = getElementID(node);
      meta[elementID] = metaValue;
    }
  });
  for (const watch of collector.$watches$) {
    destroyWatch(watch);
  }
  return {
    state: {
      ctx: meta,
      objs: convertedObjs,
      subs,
    },
    objs,
    listeners,
    mode: canRender ? "render" : "listeners",
  };
};
const getNodesInScope = (parent, predicate) => {
  predicate(parent);
  const walker = parent.ownerDocument.createTreeWalker(parent, 129, {
    acceptNode: (node) => (isContainer(node) ? 2 : predicate(node) ? 1 : 3),
  });
  const pars = [];
  let currentNode = null;
  for (; (currentNode = walker.nextNode()); ) {
    pars.push(processVirtualNodes(currentNode));
  }
  return pars;
};
const reviveNestedObjects = (obj, getObject, parser) => {
  if (!parser.fill(obj) && obj && "object" == typeof obj) {
    if (isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const value = obj[i];
        "string" == typeof value
          ? (obj[i] = getObject(value))
          : reviveNestedObjects(value, getObject, parser);
      }
    } else if (isSerializableObject(obj)) {
      for (const key of Object.keys(obj)) {
        const value = obj[key];
        "string" == typeof value
          ? (obj[key] = getObject(value))
          : reviveNestedObjects(value, getObject, parser);
      }
    }
  }
};
const OBJECT_TRANSFORMS = {
  "!": (obj, containerState) => {
    var _a2;
    return (_a2 = containerState.$proxyMap$.get(obj)) != null
      ? _a2
      : getOrCreateProxy(obj, containerState);
  },
  "%": (obj) => mutable(obj),
  "~": (obj) => Promise.resolve(obj),
  _: (obj) => Promise.reject(obj),
};
const collectMutableProps = (el, props, collector) => {
  const subs = getProxySubs(props);
  subs && subs.has(el) && collectElement(el, collector);
};
const createCollector = (containerState) => ({
  $containerState$: containerState,
  $seen$: /* @__PURE__ */ new Set(),
  $objSet$: /* @__PURE__ */ new Set(),
  $noSerialize$: [],
  $elements$: [],
  $watches$: [],
  $promises$: [],
});
const collectDeferElement = (el, collector) => {
  collector.$elements$.includes(el) || collector.$elements$.push(el);
};
const collectElement = (el, collector) => {
  if (collector.$elements$.includes(el)) {
    return;
  }
  const ctx = tryGetContext(el);
  ctx && (collector.$elements$.push(el), collectElementData(ctx, collector));
};
const collectElementData = (ctx, collector) => {
  if (
    (ctx.$props$ && collectValue(ctx.$props$, collector, false),
    ctx.$renderQrl$ && collectValue(ctx.$renderQrl$, collector, false),
    ctx.$seq$)
  ) {
    for (const obj of ctx.$seq$) {
      collectValue(obj, collector, false);
    }
  }
  if (ctx.$watches$) {
    for (const obj of ctx.$watches$) {
      collectValue(obj, collector, false);
    }
  }
  if (ctx.$contexts$) {
    for (const obj of ctx.$contexts$.values()) {
      collectValue(obj, collector, false);
    }
  }
};
const PROMISE_VALUE = Symbol();
const getPromiseValue = (promise) => promise[PROMISE_VALUE];
const collectValue = (obj, collector, leaks) => {
  if (null !== obj) {
    const objType = typeof obj;
    const seen = collector.$seen$;
    switch (objType) {
      case "function":
        if (seen.has(obj)) {
          return;
        }
        if ((seen.add(obj), !fastShouldSerialize(obj))) {
          return (
            collector.$objSet$.add(void 0),
            void collector.$noSerialize$.push(obj)
          );
        }
        if (isQrl$1(obj)) {
          if ((collector.$objSet$.add(obj), obj.$captureRef$)) {
            for (const item of obj.$captureRef$) {
              collectValue(item, collector, leaks);
            }
          }
          return;
        }
        break;
      case "object": {
        if (seen.has(obj)) {
          return;
        }
        if ((seen.add(obj), !fastShouldSerialize(obj))) {
          return (
            collector.$objSet$.add(void 0),
            void collector.$noSerialize$.push(obj)
          );
        }
        if (isPromise(obj)) {
          return void collector.$promises$.push(
            ((promise = obj),
            promise.then(
              (value) => {
                const v = {
                  resolved: true,
                  value,
                };
                return (promise[PROMISE_VALUE] = v), value;
              },
              (value) => {
                const v = {
                  resolved: false,
                  value,
                };
                return (promise[PROMISE_VALUE] = v), value;
              }
            )).then((value) => {
              collectValue(value, collector, leaks);
            })
          );
        }
        const target = getProxyTarget(obj);
        const input = obj;
        if (target) {
          if (
            (leaks &&
              ((proxy, collector2) => {
                const subs = getProxySubs(proxy);
                if (!collector2.$seen$.has(subs)) {
                  collector2.$seen$.add(subs);
                  for (const key of Array.from(subs.keys())) {
                    isNode(key) && isVirtualElement(key)
                      ? collectDeferElement(key, collector2)
                      : collectValue(key, collector2, true);
                  }
                }
              })(input, collector),
            (obj = target),
            seen.has(obj))
          ) {
            return;
          }
          if ((seen.add(obj), isResourceReturn(obj))) {
            return (
              collector.$objSet$.add(target),
              collectValue(obj.promise, collector, leaks),
              void collectValue(obj.resolved, collector, leaks)
            );
          }
        } else if (isNode(obj)) {
          return;
        }
        if (isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            collectValue(input[i], collector, leaks);
          }
        } else {
          for (const key of Object.keys(obj)) {
            collectValue(input[key], collector, leaks);
          }
        }
        break;
      }
    }
  }
  var promise;
  collector.$objSet$.add(obj);
};
const isContainer = (el) => isElement(el) && el.hasAttribute("q:container");
const hasQId = (el) => {
  const node = processVirtualNodes(el);
  return !!isQwikElement(node) && node.hasAttribute("q:id");
};
const intToStr = (nu) => nu.toString(36);
const strToInt = (nu) => parseInt(nu, 36);
const getEventName = (attribute) => {
  const colonPos = attribute.indexOf(":");
  return attribute
    .slice(colonPos + 1)
    .replace(/-./g, (x) => x[1].toUpperCase());
};
const WatchFlagsIsEffect = 1;
const WatchFlagsIsWatch = 2;
const WatchFlagsIsDirty = 4;
const WatchFlagsIsCleanup = 8;
const WatchFlagsIsResource = 16;
const useWatchQrl = (qrl, opts) => {
  const { get, set, ctx, i } = useSequentialScope();
  if (get) {
    return;
  }
  const el = ctx.$hostElement$;
  const containerState = ctx.$renderCtx$.$static$.$containerState$;
  const watch = new Watch(
    WatchFlagsIsDirty | WatchFlagsIsWatch,
    i,
    el,
    qrl,
    void 0
  );
  const elCtx = getContext(el);
  set(true),
    qrl.$resolveLazy$(containerState.$containerEl$),
    elCtx.$watches$ || (elCtx.$watches$ = []),
    elCtx.$watches$.push(watch),
    waitAndRun(ctx, () =>
      runSubscriber(watch, containerState, ctx.$renderCtx$)
    ),
    isServer$1() && useRunWatch(watch, opts == null ? void 0 : opts.eagerness);
};
const isResourceWatch = (watch) => !!watch.$resource$;
const runSubscriber = (watch, containerState, rctx) => (
  watch.$flags$,
  isResourceWatch(watch)
    ? runResource(watch, containerState)
    : runWatch(watch, containerState, rctx)
);
const runResource = (watch, containerState, waitOn) => {
  (watch.$flags$ &= ~WatchFlagsIsDirty), cleanupWatch(watch);
  const el = watch.$el$;
  const invokationContext = newInvokeContext(el, void 0, "WatchEvent");
  const { $subsManager$: subsManager } = containerState;
  const watchFn = watch.$qrl$.getFn(invokationContext, () => {
    subsManager.$clearSub$(watch);
  });
  const cleanups = [];
  const resource = watch.$resource$;
  const resourceTarget = unwrapProxy(resource);
  const opts = {
    track: (obj, prop) => {
      const target = getProxyTarget(obj);
      return (
        target
          ? subsManager.$getLocal$(target).$addSub$(watch, prop)
          : logErrorAndStop(codeToText(QError_trackUseStore), obj),
        prop ? obj[prop] : obj
      );
    },
    cleanup(callback) {
      cleanups.push(callback);
    },
    previous: resourceTarget.resolved,
  };
  let resolve;
  let reject;
  let done = false;
  const setState = (resolved, value) =>
    !done &&
    ((done = true),
    resolved
      ? ((done = true),
        (resource.state = "resolved"),
        (resource.resolved = value),
        (resource.error = void 0),
        resolve(value))
      : ((done = true),
        (resource.state = "rejected"),
        (resource.resolved = void 0),
        (resource.error = value),
        reject(value)),
    true);
  invoke(invokationContext, () => {
    (resource.state = "pending"),
      (resource.resolved = void 0),
      (resource.promise = new Promise((r, re) => {
        (resolve = r), (reject = re);
      }));
  }),
    (watch.$destroy$ = noSerialize(() => {
      cleanups.forEach((fn) => fn());
    }));
  const promise = safeCall(
    () => then(waitOn, () => watchFn(opts)),
    (value) => {
      setState(true, value);
    },
    (reason) => {
      setState(false, reason);
    }
  );
  const timeout = resourceTarget.timeout;
  return timeout
    ? Promise.race([
        promise,
        delay(timeout).then(() => {
          setState(false, "timeout") && cleanupWatch(watch);
        }),
      ])
    : promise;
};
const runWatch = (watch, containerState, rctx) => {
  (watch.$flags$ &= ~WatchFlagsIsDirty), cleanupWatch(watch);
  const hostElement = watch.$el$;
  const invokationContext = newInvokeContext(hostElement, void 0, "WatchEvent");
  const { $subsManager$: subsManager } = containerState;
  const watchFn = watch.$qrl$.getFn(invokationContext, () => {
    subsManager.$clearSub$(watch);
  });
  const cleanups = [];
  watch.$destroy$ = noSerialize(() => {
    cleanups.forEach((fn) => fn());
  });
  const opts = {
    track: (obj, prop) => {
      const target = getProxyTarget(obj);
      return (
        target
          ? subsManager.$getLocal$(target).$addSub$(watch, prop)
          : logErrorAndStop(codeToText(QError_trackUseStore), obj),
        prop ? obj[prop] : obj
      );
    },
    cleanup(callback) {
      cleanups.push(callback);
    },
  };
  return safeCall(
    () => watchFn(opts),
    (returnValue) => {
      isFunction(returnValue) && cleanups.push(returnValue);
    },
    (reason) => {
      handleError(reason, hostElement, rctx);
    }
  );
};
const cleanupWatch = (watch) => {
  const destroy = watch.$destroy$;
  if (destroy) {
    watch.$destroy$ = void 0;
    try {
      destroy();
    } catch (err) {
      logError(err);
    }
  }
};
const destroyWatch = (watch) => {
  watch.$flags$ & WatchFlagsIsCleanup
    ? ((watch.$flags$ &= ~WatchFlagsIsCleanup), (0, watch.$qrl$)())
    : cleanupWatch(watch);
};
const useRunWatch = (watch, eagerness) => {
  "load" === eagerness
    ? useOn("qinit", getWatchHandlerQrl(watch))
    : "visible" === eagerness && useOn("qvisible", getWatchHandlerQrl(watch));
};
const getWatchHandlerQrl = (watch) => {
  const watchQrl = watch.$qrl$;
  return createQRL(
    watchQrl.$chunk$,
    "_hW",
    _hW,
    null,
    null,
    [watch],
    watchQrl.$symbol$
  );
};
class Watch {
  constructor($flags$, $index$, $el$, $qrl$, $resource$) {
    (this.$flags$ = $flags$),
      (this.$index$ = $index$),
      (this.$el$ = $el$),
      (this.$qrl$ = $qrl$),
      (this.$resource$ = $resource$);
  }
}
const _createResourceReturn = (opts) => ({
  __brand: "resource",
  promise: void 0,
  resolved: void 0,
  error: void 0,
  state: "pending",
  timeout: opts == null ? void 0 : opts.timeout,
});
const isResourceReturn = (obj) => isObject(obj) && "resource" === obj.__brand;
const UNDEFINED_PREFIX = "";
const QRLSerializer = {
  prefix: "",
  test: (v) => isQrl$1(v),
  serialize: (obj, getObjId, containerState) =>
    stringifyQRL(obj, {
      $getObjId$: getObjId,
    }),
  prepare: (data, containerState) =>
    parseQRL(data, containerState.$containerEl$),
  fill: (qrl, getObject) => {
    qrl.$capture$ &&
      qrl.$capture$.length > 0 &&
      ((qrl.$captureRef$ = qrl.$capture$.map(getObject)),
      (qrl.$capture$ = null));
  },
};
const WatchSerializer = {
  prefix: "",
  test: (v) => {
    return isObject((obj = v)) && obj instanceof Watch;
    var obj;
  },
  serialize: (obj, getObjId) =>
    ((watch, getObjId2) => {
      let value = `${intToStr(watch.$flags$)} ${intToStr(
        watch.$index$
      )} ${getObjId2(watch.$qrl$)} ${getObjId2(watch.$el$)}`;
      return (
        isResourceWatch(watch) && (value += ` ${getObjId2(watch.$resource$)}`),
        value
      );
    })(obj, getObjId),
  prepare: (data) =>
    ((data2) => {
      const [flags, index2, qrl, el, resource] = data2.split(" ");
      return new Watch(strToInt(flags), strToInt(index2), el, qrl, resource);
    })(data),
  fill: (watch, getObject) => {
    (watch.$el$ = getObject(watch.$el$)),
      (watch.$qrl$ = getObject(watch.$qrl$)),
      watch.$resource$ && (watch.$resource$ = getObject(watch.$resource$));
  },
};
const ResourceSerializer = {
  prefix: "",
  test: (v) => isResourceReturn(v),
  serialize: (obj, getObjId) =>
    ((resource, getObjId2) => {
      const state = resource.state;
      return "resolved" === state
        ? `0 ${getObjId2(resource.resolved)}`
        : "pending" === state
        ? "1"
        : `2 ${getObjId2(resource.error)}`;
    })(obj, getObjId),
  prepare: (data) =>
    ((data2) => {
      const [first, id] = data2.split(" ");
      const result = _createResourceReturn(void 0);
      return (
        (result.promise = Promise.resolve()),
        "0" === first
          ? ((result.state = "resolved"), (result.resolved = id))
          : "1" === first
          ? ((result.state = "pending"),
            (result.promise = new Promise(() => {})))
          : "2" === first && ((result.state = "rejected"), (result.error = id)),
        result
      );
    })(data),
  fill: (resource, getObject) => {
    if ("resolved" === resource.state) {
      (resource.resolved = getObject(resource.resolved)),
        (resource.promise = Promise.resolve(resource.resolved));
    } else if ("rejected" === resource.state) {
      const p = Promise.reject(resource.error);
      p.catch(() => null),
        (resource.error = getObject(resource.error)),
        (resource.promise = p);
    }
  },
};
const URLSerializer = {
  prefix: "",
  test: (v) => v instanceof URL,
  serialize: (obj) => obj.href,
  prepare: (data) => new URL(data),
  fill: void 0,
};
const DateSerializer = {
  prefix: "",
  test: (v) => v instanceof Date,
  serialize: (obj) => obj.toISOString(),
  prepare: (data) => new Date(data),
  fill: void 0,
};
const RegexSerializer = {
  prefix: "\x07",
  test: (v) => v instanceof RegExp,
  serialize: (obj) => `${obj.flags} ${obj.source}`,
  prepare: (data) => {
    const space = data.indexOf(" ");
    const source = data.slice(space + 1);
    const flags = data.slice(0, space);
    return new RegExp(source, flags);
  },
  fill: void 0,
};
const ErrorSerializer = {
  prefix: "",
  test: (v) => v instanceof Error,
  serialize: (obj) => obj.message,
  prepare: (text) => {
    const err = new Error(text);
    return (err.stack = void 0), err;
  },
  fill: void 0,
};
const DocumentSerializer = {
  prefix: "",
  test: (v) => isDocument(v),
  serialize: void 0,
  prepare: (_, _c, doc) => doc,
  fill: void 0,
};
const SERIALIZABLE_STATE = Symbol("serializable-data");
const ComponentSerializer = {
  prefix: "",
  test: (obj) => isQwikComponent(obj),
  serialize: (obj, getObjId, containerState) => {
    const [qrl] = obj[SERIALIZABLE_STATE];
    return stringifyQRL(qrl, {
      $getObjId$: getObjId,
    });
  },
  prepare: (data, containerState) => {
    const optionsIndex = data.indexOf("{");
    const qrlString = -1 == optionsIndex ? data : data.slice(0, optionsIndex);
    const qrl = parseQRL(qrlString, containerState.$containerEl$);
    return componentQrl(qrl);
  },
  fill: (component, getObject) => {
    const [qrl] = component[SERIALIZABLE_STATE];
    qrl.$capture$ &&
      qrl.$capture$.length > 0 &&
      ((qrl.$captureRef$ = qrl.$capture$.map(getObject)),
      (qrl.$capture$ = null));
  },
};
const serializers = [
  QRLSerializer,
  WatchSerializer,
  ResourceSerializer,
  URLSerializer,
  DateSerializer,
  RegexSerializer,
  ErrorSerializer,
  DocumentSerializer,
  ComponentSerializer,
  {
    prefix: "",
    test: (obj) =>
      "function" == typeof obj && void 0 !== obj.__qwik_serializable__,
    serialize: (obj) => obj.toString(),
    prepare: (data) => {
      const fn = new Function("return " + data)();
      return (fn.__qwik_serializable__ = true), fn;
    },
    fill: void 0,
  },
];
const serializeValue = (obj, getObjID, containerState) => {
  for (const s of serializers) {
    if (s.test(obj)) {
      let value = s.prefix;
      return (
        s.serialize && (value += s.serialize(obj, getObjID, containerState)),
        value
      );
    }
  }
};
const getOrCreateProxy = (target, containerState, flags = 0) =>
  containerState.$proxyMap$.get(target) ||
  createProxy(target, containerState, flags, void 0);
const createProxy = (target, containerState, flags, subs) => {
  unwrapProxy(target), containerState.$proxyMap$.has(target);
  const manager = containerState.$subsManager$.$getLocal$(target, subs);
  const proxy = new Proxy(
    target,
    new ReadWriteProxyHandler(containerState, manager, flags)
  );
  return containerState.$proxyMap$.set(target, proxy), proxy;
};
const QOjectTargetSymbol = Symbol();
const QOjectSubsSymbol = Symbol();
const QOjectFlagsSymbol = Symbol();
class ReadWriteProxyHandler {
  constructor($containerState$, $manager$, $flags$) {
    (this.$containerState$ = $containerState$),
      (this.$manager$ = $manager$),
      (this.$flags$ = $flags$);
  }
  get(target, prop) {
    if ("symbol" == typeof prop) {
      return prop === QOjectTargetSymbol
        ? target
        : prop === QOjectFlagsSymbol
        ? this.$flags$
        : prop === QOjectSubsSymbol
        ? this.$manager$.$subs$
        : target[prop];
    }
    let subscriber;
    const invokeCtx = tryGetInvokeContext();
    const recursive = 0 != (1 & this.$flags$);
    const immutable = 0 != (2 & this.$flags$);
    invokeCtx && (subscriber = invokeCtx.$subscriber$);
    let value = target[prop];
    if (
      (isMutable(value)
        ? (value = value.mut)
        : immutable && (subscriber = null),
      subscriber)
    ) {
      const isA = isArray(target);
      this.$manager$.$addSub$(subscriber, isA ? void 0 : prop);
    }
    return recursive ? wrap(value, this.$containerState$) : value;
  }
  set(target, prop, newValue) {
    if ("symbol" == typeof prop) {
      return (target[prop] = newValue), true;
    }
    if (0 != (2 & this.$flags$)) {
      throw qError(QError_immutableProps);
    }
    const unwrappedNewValue =
      0 != (1 & this.$flags$) ? unwrapProxy(newValue) : newValue;
    return isArray(target)
      ? ((target[prop] = unwrappedNewValue),
        this.$manager$.$notifySubs$(),
        true)
      : (target[prop] !== unwrappedNewValue &&
          ((target[prop] = unwrappedNewValue),
          this.$manager$.$notifySubs$(prop)),
        true);
  }
  has(target, property) {
    return (
      property === QOjectTargetSymbol ||
      property === QOjectFlagsSymbol ||
      Object.prototype.hasOwnProperty.call(target, property)
    );
  }
  ownKeys(target) {
    let subscriber = null;
    const invokeCtx = tryGetInvokeContext();
    return (
      invokeCtx && (subscriber = invokeCtx.$subscriber$),
      subscriber && this.$manager$.$addSub$(subscriber),
      Object.getOwnPropertyNames(target)
    );
  }
}
const wrap = (value, containerState) => {
  if (isQrl$1(value)) {
    return value;
  }
  if (isObject(value)) {
    if (Object.isFrozen(value)) {
      return value;
    }
    const nakedValue = unwrapProxy(value);
    return nakedValue !== value || isNode(nakedValue)
      ? value
      : shouldSerialize(nakedValue)
      ? containerState.$proxyMap$.get(value) ||
        getOrCreateProxy(value, containerState, 1)
      : value;
  }
  return value;
};
const noSerializeSet = /* @__PURE__ */ new WeakSet();
const shouldSerialize = (obj) =>
  (!isObject(obj) && !isFunction(obj)) || !noSerializeSet.has(obj);
const fastShouldSerialize = (obj) => !noSerializeSet.has(obj);
const noSerialize = (input) => (
  null != input && noSerializeSet.add(input), input
);
const mutable = (v) => new MutableImpl(v);
class MutableImpl {
  constructor(mut) {
    this.mut = mut;
  }
}
const isMutable = (v) => v instanceof MutableImpl;
const unwrapProxy = (proxy) => {
  var _a2;
  return isObject(proxy)
    ? (_a2 = getProxyTarget(proxy)) != null
      ? _a2
      : proxy
    : proxy;
};
const getProxyTarget = (obj) => obj[QOjectTargetSymbol];
const getProxySubs = (obj) => obj[QOjectSubsSymbol];
const getProxyFlags = (obj) => {
  if (isObject(obj)) {
    return obj[QOjectFlagsSymbol];
  }
};
const resumeIfNeeded = (containerEl) => {
  "paused" === directGetAttribute(containerEl, "q:container") &&
    (((containerEl2) => {
      if (!isContainer(containerEl2)) {
        return void logWarn();
      }
      const doc = getDocument(containerEl2);
      const script = ((parentElm) => {
        let child = parentElm.lastElementChild;
        for (; child; ) {
          if (
            "SCRIPT" === child.tagName &&
            "qwik/json" === directGetAttribute(child, "type")
          ) {
            return child;
          }
          child = child.previousElementSibling;
        }
      })(containerEl2 === doc.documentElement ? doc.body : containerEl2);
      if (!script) {
        return void logWarn();
      }
      script.remove();
      const containerState = getContainerState(containerEl2);
      ((containerEl3, containerState2) => {
        const head2 = containerEl3.ownerDocument.head;
        containerEl3.querySelectorAll("style[q\\:style]").forEach((el2) => {
          containerState2.$styleIds$.add(directGetAttribute(el2, "q:style")),
            head2.appendChild(el2);
        });
      })(containerEl2, containerState);
      const meta = JSON.parse(
        (script.textContent || "{}").replace(/\\x3C(\/?script)/g, "<$1")
      );
      const elements = /* @__PURE__ */ new Map();
      const getObject = (id) =>
        ((id2, elements2, objs, containerState2) => {
          if (("string" == typeof id2 && id2.length, id2.startsWith("#"))) {
            return elements2.has(id2), elements2.get(id2);
          }
          const index2 = strToInt(id2);
          objs.length;
          let obj = objs[index2];
          for (let i = id2.length - 1; i >= 0; i--) {
            const code = id2[i];
            const transform = OBJECT_TRANSFORMS[code];
            if (!transform) {
              break;
            }
            obj = transform(obj, containerState2);
          }
          return obj;
        })(id, elements, meta.objs, containerState);
      let maxId = 0;
      getNodesInScope(containerEl2, hasQId).forEach((el2) => {
        const id = directGetAttribute(el2, "q:id");
        const ctx = getContext(el2);
        (ctx.$id$ = id),
          isElement(el2) && (ctx.$vdom$ = domToVnode(el2)),
          elements.set("#" + id, el2),
          (maxId = Math.max(maxId, strToInt(id)));
      }),
        (containerState.$elementIndex$ = ++maxId);
      const parser = ((getObject2, containerState2, doc2) => {
        const map = /* @__PURE__ */ new Map();
        return {
          prepare(data) {
            for (const s of serializers) {
              const prefix = s.prefix;
              if (data.startsWith(prefix)) {
                const value = s.prepare(
                  data.slice(prefix.length),
                  containerState2,
                  doc2
                );
                return s.fill && map.set(value, s), value;
              }
            }
            return data;
          },
          fill(obj) {
            const serializer = map.get(obj);
            return (
              !!serializer &&
              (serializer.fill(obj, getObject2, containerState2), true)
            );
          },
        };
      })(getObject, containerState, doc);
      ((objs, subs, getObject2, containerState2, parser2) => {
        for (let i = 0; i < objs.length; i++) {
          const value = objs[i];
          isString(value) &&
            (objs[i] =
              value === UNDEFINED_PREFIX ? void 0 : parser2.prepare(value));
        }
        for (let i = 0; i < subs.length; i++) {
          const value = objs[i];
          const sub = subs[i];
          if (sub) {
            const converted = /* @__PURE__ */ new Map();
            let flags = 0;
            for (const key of Object.keys(sub)) {
              const v = sub[key];
              if ("$" === key) {
                flags = v;
                continue;
              }
              const el2 = getObject2(key);
              if (!el2) {
                continue;
              }
              const set = null === v ? null : new Set(v);
              converted.set(el2, set);
            }
            createProxy(value, containerState2, flags, converted);
          }
        }
      })(meta.objs, meta.subs, getObject, containerState, parser);
      for (const obj of meta.objs) {
        reviveNestedObjects(obj, getObject, parser);
      }
      for (const elementID of Object.keys(meta.ctx)) {
        elementID.startsWith("#");
        const ctxMeta = meta.ctx[elementID];
        const el2 = elements.get(elementID);
        const ctx = getContext(el2);
        const refMap = ctxMeta.r;
        const seq = ctxMeta.s;
        const host = ctxMeta.h;
        const contexts = ctxMeta.c;
        const watches = ctxMeta.w;
        if (
          (refMap &&
            (isElement(el2),
            (ctx.$refMap$ = refMap.split(" ").map(getObject)),
            (ctx.li = getDomListeners(ctx, containerEl2))),
          seq && (ctx.$seq$ = seq.split(" ").map(getObject)),
          watches && (ctx.$watches$ = watches.split(" ").map(getObject)),
          contexts)
        ) {
          ctx.$contexts$ = /* @__PURE__ */ new Map();
          for (const part of contexts.split(" ")) {
            const [key, value] = part.split("=");
            ctx.$contexts$.set(key, getObject(value));
          }
        }
        if (host) {
          const [props, renderQrl] = host.split(" ");
          const styleIds = el2.getAttribute("q:sstyle");
          (ctx.$scopeIds$ = styleIds ? styleIds.split(" ") : null),
            (ctx.$mounted$ = true),
            (ctx.$props$ = getObject(props)),
            (ctx.$renderQrl$ = getObject(renderQrl));
        }
      }
      var el;
      directSetAttribute(containerEl2, "q:container", "resumed"),
        (el = containerEl2) &&
          "function" == typeof CustomEvent &&
          el.dispatchEvent(
            new CustomEvent("qresume", {
              detail: void 0,
              bubbles: true,
              composed: true,
            })
          );
    })(containerEl),
    appendQwikDevTools(containerEl));
};
const appendQwikDevTools = (containerEl) => {
  containerEl.qwik = {
    pause: () =>
      (async (elmOrDoc, defaultParentJSON) => {
        const doc = getDocument(elmOrDoc);
        const documentElement = doc.documentElement;
        const containerEl2 = isDocument(elmOrDoc) ? documentElement : elmOrDoc;
        if ("paused" === directGetAttribute(containerEl2, "q:container")) {
          throw qError(QError_containerAlreadyPaused);
        }
        const parentJSON =
          containerEl2 === doc.documentElement ? doc.body : containerEl2;
        const data = await (async (containerEl3) => {
          const containerState = getContainerState(containerEl3);
          const contexts = getNodesInScope(containerEl3, hasQId).map(
            tryGetContext
          );
          return _pauseFromContexts(contexts, containerState);
        })(containerEl2);
        const script = doc.createElement("script");
        return (
          directSetAttribute(script, "type", "qwik/json"),
          (script.textContent = JSON.stringify(
            data.state,
            void 0,
            void 0
          ).replace(/<(\/?script)/g, "\\x3C$1")),
          parentJSON.appendChild(script),
          directSetAttribute(containerEl2, "q:container", "paused"),
          data
        );
      })(containerEl),
    state: getContainerState(containerEl),
  };
};
const tryGetContext = (element) => element._qc_;
const getContext = (element) => {
  let ctx = tryGetContext(element);
  return (
    ctx ||
      (element._qc_ = ctx =
        {
          $dirty$: false,
          $mounted$: false,
          $attachedListeners$: false,
          $id$: "",
          $element$: element,
          $refMap$: [],
          li: {},
          $watches$: null,
          $seq$: null,
          $slots$: null,
          $scopeIds$: null,
          $appendStyles$: null,
          $props$: null,
          $vdom$: null,
          $renderQrl$: null,
          $contexts$: null,
        }),
    ctx
  );
};
const cleanupContext = (ctx, subsManager) => {
  var _a2;
  const el = ctx.$element$;
  (_a2 = ctx.$watches$) == null
    ? void 0
    : _a2.forEach((watch) => {
        subsManager.$clearSub$(watch), destroyWatch(watch);
      }),
    ctx.$renderQrl$ && subsManager.$clearSub$(el),
    (ctx.$renderQrl$ = null),
    (ctx.$seq$ = null),
    (ctx.$watches$ = null),
    (ctx.$dirty$ = false),
    (el._qc_ = void 0);
};
const PREFIXES = ["on", "window:on", "document:on"];
const SCOPED = ["on", "on-window", "on-document"];
const normalizeOnProp = (prop) => {
  let scope = "on";
  for (let i = 0; i < PREFIXES.length; i++) {
    const prefix = PREFIXES[i];
    if (prop.startsWith(prefix)) {
      (scope = SCOPED[i]), (prop = prop.slice(prefix.length));
      break;
    }
  }
  return (
    scope +
    ":" +
    (prop.startsWith("-")
      ? fromCamelToKebabCase(prop.slice(1))
      : prop.toLowerCase())
  );
};
const createProps = (target, containerState) =>
  createProxy(target, containerState, 2);
const getPropsMutator = (ctx, containerState) => {
  let props = ctx.$props$;
  props || (ctx.$props$ = props = createProps({}, containerState));
  const target = getProxyTarget(props);
  const manager = containerState.$subsManager$.$getLocal$(target);
  return {
    set(prop, value) {
      let oldValue = target[prop];
      isMutable(oldValue) && (oldValue = oldValue.mut),
        containerState.$mutableProps$
          ? isMutable(value)
            ? ((value = value.mut), (target[prop] = value))
            : (target[prop] = mutable(value))
          : ((target[prop] = value),
            isMutable(value) && ((value = value.mut), true)),
        oldValue !== value && manager.$notifySubs$(prop);
    },
  };
};
const inflateQrl = (qrl, elCtx) => (
  qrl.$capture$,
  (qrl.$captureRef$ = qrl.$capture$.map((idx) => {
    const int = parseInt(idx, 10);
    const obj = elCtx.$refMap$[int];
    return elCtx.$refMap$.length, obj;
  }))
);
const logError = (message, ...optionalParams) => {
  const err = message instanceof Error ? message : new Error(message);
  return (
    "function" == typeof globalThis._handleError && message instanceof Error
      ? globalThis._handleError(message, optionalParams)
      : console.error(
          "%cQWIK ERROR",
          "",
          err.message,
          ...printParams(optionalParams),
          err.stack
        ),
    err
  );
};
const logErrorAndStop = (message, ...optionalParams) =>
  logError(message, ...optionalParams);
const logWarn = (message, ...optionalParams) => {};
const printParams = (optionalParams) => optionalParams;
const QError_stringifyClassOrStyle = 0;
const QError_verifySerializable = 3;
const QError_setProperty = 6;
const QError_notFoundContext = 13;
const QError_useMethodOutsideContext = 14;
const QError_immutableProps = 17;
const QError_useInvokeContext = 20;
const QError_containerAlreadyPaused = 21;
const QError_invalidJsxNodeType = 25;
const QError_trackUseStore = 26;
const QError_missingObjectId = 27;
const qError = (code, ...parts) => {
  const text = codeToText(code);
  return logErrorAndStop(text, ...parts);
};
const codeToText = (code) => `Code(${code})`;
const isQrl$1 = (value) =>
  "function" == typeof value && "function" == typeof value.getSymbol;
const createQRL = (
  chunk,
  symbol,
  symbolRef,
  symbolFn,
  capture,
  captureRef,
  refSymbol
) => {
  let _containerEl;
  const setContainer = (el) => {
    _containerEl || (_containerEl = el);
  };
  const resolve = async (containerEl) => {
    if ((containerEl && setContainer(containerEl), symbolRef)) {
      return symbolRef;
    }
    if (symbolFn) {
      return (symbolRef = symbolFn().then(
        (module) => (symbolRef = module[symbol])
      ));
    }
    {
      if (!_containerEl) {
        throw new Error(
          `QRL '${chunk}#${
            symbol || "default"
          }' does not have an attached container`
        );
      }
      const symbol2 = getPlatform().importSymbol(_containerEl, chunk, symbol);
      return (symbolRef = then(symbol2, (ref) => (symbolRef = ref)));
    }
  };
  const resolveLazy = (containerEl) => symbolRef || resolve(containerEl);
  const invokeFn =
    (currentCtx, beforeFn) =>
    (...args) => {
      const fn = resolveLazy();
      return then(fn, (fn2) => {
        if (isFunction(fn2)) {
          if (beforeFn && false === beforeFn()) {
            return;
          }
          const context = {
            ...createInvokationContext(currentCtx),
            $qrl$: QRL,
          };
          return (
            emitUsedSymbol(symbol, context.$element$),
            invoke(context, fn2, ...args)
          );
        }
        throw qError(10);
      });
    };
  const createInvokationContext = (invoke2) =>
    null == invoke2
      ? newInvokeContext()
      : isArray(invoke2)
      ? newInvokeContextFromTuple(invoke2)
      : invoke2;
  const invokeQRL = async function (...args) {
    const fn = invokeFn();
    return await fn(...args);
  };
  const resolvedSymbol = refSymbol != null ? refSymbol : symbol;
  const hash = getSymbolHash$1(resolvedSymbol);
  const QRL = invokeQRL;
  const methods = {
    getSymbol: () => resolvedSymbol,
    getHash: () => hash,
    resolve,
    $resolveLazy$: resolveLazy,
    $setContainer$: setContainer,
    $chunk$: chunk,
    $symbol$: symbol,
    $refSymbol$: refSymbol,
    $hash$: hash,
    getFn: invokeFn,
    $capture$: capture,
    $captureRef$: captureRef,
  };
  return Object.assign(invokeQRL, methods);
};
const getSymbolHash$1 = (symbolName) => {
  const index2 = symbolName.lastIndexOf("_");
  return index2 > -1 ? symbolName.slice(index2 + 1) : symbolName;
};
const emitUsedSymbol = (symbol, element) => {
  isServer$1() ||
    "object" != typeof document ||
    document.dispatchEvent(
      new CustomEvent("qsymbol", {
        bubbles: false,
        detail: {
          symbol,
          element,
          timestamp: performance.now(),
        },
      })
    );
};
let runtimeSymbolId = 0;
const inlinedQrl = (symbol, symbolName, lexicalScopeCapture = EMPTY_ARRAY$1) =>
  createQRL(
    "/inlinedQRL",
    symbolName,
    symbol,
    null,
    null,
    lexicalScopeCapture,
    null
  );
const stringifyQRL = (qrl, opts = {}) => {
  var _a2;
  let symbol = qrl.$symbol$;
  let chunk = qrl.$chunk$;
  const refSymbol = (_a2 = qrl.$refSymbol$) != null ? _a2 : symbol;
  const platform = getPlatform();
  if (platform) {
    const result = platform.chunkForSymbol(refSymbol);
    result && ((chunk = result[1]), qrl.$refSymbol$ || (symbol = result[0]));
  }
  chunk.startsWith("./") && (chunk = chunk.slice(2));
  const parts = [chunk];
  symbol && "default" !== symbol && parts.push("#", symbol);
  const capture = qrl.$capture$;
  const captureRef = qrl.$captureRef$;
  if (captureRef && captureRef.length) {
    if (opts.$getObjId$) {
      const capture2 = captureRef.map(opts.$getObjId$);
      parts.push(`[${capture2.join(" ")}]`);
    } else if (opts.$addRefMap$) {
      const capture2 = captureRef.map(opts.$addRefMap$);
      parts.push(`[${capture2.join(" ")}]`);
    }
  } else {
    capture && capture.length > 0 && parts.push(`[${capture.join(" ")}]`);
  }
  return parts.join("");
};
const serializeQRLs = (existingQRLs, elCtx) => {
  var value;
  (function (value2) {
    return value2 && "number" == typeof value2.nodeType;
  })((value = elCtx.$element$)) && value.nodeType;
  const opts = {
    $element$: elCtx.$element$,
    $addRefMap$: (obj) => addToArray(elCtx.$refMap$, obj),
  };
  return existingQRLs.map((qrl) => stringifyQRL(qrl, opts)).join("\n");
};
const parseQRL = (qrl, containerEl) => {
  const endIdx = qrl.length;
  const hashIdx = indexOf(qrl, 0, "#");
  const captureIdx = indexOf(qrl, hashIdx, "[");
  const chunkEndIdx = Math.min(hashIdx, captureIdx);
  const chunk = qrl.substring(0, chunkEndIdx);
  const symbolStartIdx = hashIdx == endIdx ? hashIdx : hashIdx + 1;
  const symbolEndIdx = captureIdx;
  const symbol =
    symbolStartIdx == symbolEndIdx
      ? "default"
      : qrl.substring(symbolStartIdx, symbolEndIdx);
  const captureStartIdx = captureIdx;
  const captureEndIdx = endIdx;
  const capture =
    captureStartIdx === captureEndIdx
      ? EMPTY_ARRAY$1
      : qrl.substring(captureStartIdx + 1, captureEndIdx - 1).split(" ");
  "/runtimeQRL" === chunk && logError(codeToText(2), qrl);
  const iQrl = createQRL(chunk, symbol, null, null, capture, null, null);
  return containerEl && iQrl.$setContainer$(containerEl), iQrl;
};
const indexOf = (text, startIdx, char) => {
  const endIdx = text.length;
  const charIdx = text.indexOf(char, startIdx == endIdx ? 0 : startIdx);
  return -1 == charIdx ? endIdx : charIdx;
};
const addToArray = (array, obj) => {
  const index2 = array.indexOf(obj);
  return -1 === index2 ? (array.push(obj), array.length - 1) : index2;
};
const $ = (expression) =>
  ((symbol, lexicalScopeCapture = EMPTY_ARRAY$1) =>
    createQRL(
      "/runtimeQRL",
      "s" + runtimeSymbolId++,
      symbol,
      null,
      null,
      lexicalScopeCapture,
      null
    ))(expression);
const componentQrl = (onRenderQrl) => {
  function QwikComponent(props, key) {
    const hash = onRenderQrl.$hash$;
    return jsx(
      Virtual,
      {
        "q:renderFn": onRenderQrl,
        ...props,
      },
      hash + ":" + (key || "")
    );
  }
  return (QwikComponent[SERIALIZABLE_STATE] = [onRenderQrl]), QwikComponent;
};
const isQwikComponent = (component) =>
  "function" == typeof component && void 0 !== component[SERIALIZABLE_STATE];
const Slot = (props) => {
  var _a2;
  const name = (_a2 = props.name) != null ? _a2 : "";
  return jsx(
    Virtual,
    {
      "q:s": "",
    },
    name
  );
};
const renderSSR = async (node, opts) => {
  var _a2;
  const root = opts.containerTagName;
  const containerEl = createContext(1).$element$;
  const containerState = createContainerState(containerEl);
  const rctx = createRenderContext(
    {
      nodeType: 9,
    },
    containerState
  );
  const headNodes = (_a2 = opts.beforeContent) != null ? _a2 : [];
  const ssrCtx = {
    rctx,
    $contexts$: [],
    projectedChildren: void 0,
    projectedContext: void 0,
    hostCtx: void 0,
    invocationContext: void 0,
    headNodes: "html" === root ? headNodes : [],
  };
  const containerAttributes = {
    ...opts.containerAttributes,
    "q:container": "paused",
    "q:version": "0.9.0",
    "q:render": "ssr",
    "q:base": opts.base,
    children: "html" === root ? [node] : [headNodes, node],
  };
  (containerState.$envData$ = {
    url: opts.url,
    ...opts.envData,
  }),
    (node = jsx(root, containerAttributes)),
    (containerState.$hostsRendering$ = /* @__PURE__ */ new Set()),
    (containerState.$renderPromise$ = Promise.resolve().then(() =>
      renderRoot(node, ssrCtx, opts.stream, containerState, opts)
    )),
    await containerState.$renderPromise$;
};
const renderRoot = async (node, ssrCtx, stream, containerState, opts) => {
  const beforeClose = opts.beforeClose;
  return (
    await renderNode(
      node,
      ssrCtx,
      stream,
      0,
      beforeClose
        ? (stream2) => {
            const result = beforeClose(ssrCtx.$contexts$, containerState);
            return processData(result, ssrCtx, stream2, 0, void 0);
          }
        : void 0
    ),
    ssrCtx.rctx.$static$
  );
};
const renderNodeVirtual = (
  node,
  elCtx,
  extraNodes,
  ssrCtx,
  stream,
  flags,
  beforeClose
) => {
  var _a2;
  const props = node.props;
  const renderQrl = props["q:renderFn"];
  if (renderQrl) {
    return (
      (elCtx.$renderQrl$ = renderQrl),
      renderSSRComponent(ssrCtx, stream, elCtx, node, flags, beforeClose)
    );
  }
  let virtualComment = "<!--qv" + renderVirtualAttributes(props);
  const isSlot = "q:s" in props;
  const key = null != node.key ? String(node.key) : null;
  if (
    (isSlot &&
      ((_a2 = ssrCtx.hostCtx) == null ? void 0 : _a2.$id$,
      (virtualComment += " q:sref=" + ssrCtx.hostCtx.$id$)),
    null != key && (virtualComment += " q:key=" + key),
    (virtualComment += "-->"),
    stream.write(virtualComment),
    extraNodes)
  ) {
    for (const node2 of extraNodes) {
      renderNodeElementSync(node2.type, node2.props, stream);
    }
  }
  const promise = walkChildren(props.children, ssrCtx, stream, flags);
  return then(promise, () => {
    var _a3;
    if (!isSlot && !beforeClose) {
      return void stream.write(CLOSE_VIRTUAL);
    }
    let promise2;
    if (isSlot) {
      const content =
        (_a3 = ssrCtx.projectedChildren) == null ? void 0 : _a3[key];
      content &&
        ((ssrCtx.projectedChildren[key] = void 0),
        (promise2 = processData(
          content,
          ssrCtx.projectedContext,
          stream,
          flags
        )));
    }
    return (
      beforeClose && (promise2 = then(promise2, () => beforeClose(stream))),
      then(promise2, () => {
        stream.write(CLOSE_VIRTUAL);
      })
    );
  });
};
const CLOSE_VIRTUAL = "<!--/qv-->";
const renderVirtualAttributes = (attributes) => {
  let text = "";
  for (const prop of Object.keys(attributes)) {
    if ("children" === prop) {
      continue;
    }
    const value = attributes[prop];
    null != value && (text += " " + ("" === value ? prop : prop + "=" + value));
  }
  return text;
};
const renderNodeElementSync = (tagName, attributes, stream) => {
  if (
    (stream.write(
      "<" +
        tagName +
        ((attributes2) => {
          let text = "";
          for (const prop of Object.keys(attributes2)) {
            if ("dangerouslySetInnerHTML" === prop) {
              continue;
            }
            const value = attributes2[prop];
            null != value &&
              (text += " " + ("" === value ? prop : prop + '="' + value + '"'));
          }
          return text;
        })(attributes) +
        ">"
    ),
    !!emptyElements[tagName])
  ) {
    return;
  }
  const innerHTML = attributes.dangerouslySetInnerHTML;
  null != innerHTML && stream.write(innerHTML), stream.write(`</${tagName}>`);
};
const renderSSRComponent = (
  ssrCtx,
  stream,
  elCtx,
  node,
  flags,
  beforeClose
) => (
  setComponentProps(ssrCtx.rctx, elCtx, node.props),
  then(executeComponent(ssrCtx.rctx, elCtx), (res) => {
    const hostElement = elCtx.$element$;
    const newCtx = res.rctx;
    const invocationContext = newInvokeContext(hostElement, void 0);
    (invocationContext.$subscriber$ = hostElement),
      (invocationContext.$renderCtx$ = newCtx);
    const projectedContext = {
      ...ssrCtx,
      rctx: newCtx,
    };
    const newSSrContext = {
      ...ssrCtx,
      projectedChildren: splitProjectedChildren(node.props.children, ssrCtx),
      projectedContext,
      rctx: newCtx,
      invocationContext,
    };
    const extraNodes = [];
    if (elCtx.$appendStyles$) {
      const array = 4 & flags ? ssrCtx.headNodes : extraNodes;
      for (const style of elCtx.$appendStyles$) {
        array.push(
          jsx("style", {
            "q:style": style.styleId,
            dangerouslySetInnerHTML: style.content,
          })
        );
      }
    }
    const newID = getNextIndex(ssrCtx.rctx);
    const scopeId = elCtx.$scopeIds$
      ? serializeSStyle(elCtx.$scopeIds$)
      : void 0;
    const processedNode = jsx(
      node.type,
      {
        "q:sstyle": scopeId,
        "q:id": newID,
        children: res.node,
      },
      node.key
    );
    return (
      (elCtx.$id$ = newID),
      ssrCtx.$contexts$.push(elCtx),
      (newSSrContext.hostCtx = elCtx),
      renderNodeVirtual(
        processedNode,
        elCtx,
        extraNodes,
        newSSrContext,
        stream,
        flags,
        (stream2) =>
          beforeClose
            ? then(renderQTemplates(newSSrContext, stream2), () =>
                beforeClose(stream2)
              )
            : renderQTemplates(newSSrContext, stream2)
      )
    );
  })
);
const renderQTemplates = (ssrContext, stream) => {
  const projectedChildren = ssrContext.projectedChildren;
  if (projectedChildren) {
    const nodes = Object.keys(projectedChildren).map((slotName) => {
      const value = projectedChildren[slotName];
      if (value) {
        return jsx("q:template", {
          [QSlot]: slotName,
          hidden: "",
          "aria-hidden": "true",
          children: value,
        });
      }
    });
    return processData(nodes, ssrContext, stream, 0, void 0);
  }
};
const splitProjectedChildren = (children, ssrCtx) => {
  var _a2;
  const flatChildren = flatVirtualChildren(children, ssrCtx);
  if (null === flatChildren) {
    return;
  }
  const slotMap = {};
  for (const child of flatChildren) {
    let slotName = "";
    isJSXNode(child) &&
      (slotName = (_a2 = child.props[QSlot]) != null ? _a2 : "");
    let array = slotMap[slotName];
    array || (slotMap[slotName] = array = []), array.push(child);
  }
  return slotMap;
};
const createContext = (nodeType) =>
  getContext({
    nodeType,
    _qc_: null,
  });
const renderNode = (node, ssrCtx, stream, flags, beforeClose) => {
  var _a2;
  const tagName = node.type;
  if ("string" == typeof tagName) {
    const key = node.key;
    const props = node.props;
    const elCtx = createContext(1);
    const isHead = "head" === tagName;
    const hostCtx = ssrCtx.hostCtx;
    let openingElement =
      "<" +
      tagName +
      ((elCtx2, attributes) => {
        let text = "";
        for (const prop of Object.keys(attributes)) {
          if (
            "children" === prop ||
            "key" === prop ||
            "class" === prop ||
            "className" === prop ||
            "dangerouslySetInnerHTML" === prop
          ) {
            continue;
          }
          const value = attributes[prop];
          if ("ref" === prop) {
            value.current = elCtx2.$element$;
            continue;
          }
          if (isOnProp(prop)) {
            setEvent(elCtx2.li, prop, value);
            continue;
          }
          const attrName = processPropKey(prop);
          const attrValue = processPropValue(attrName, value);
          null != attrValue &&
            (text +=
              " " +
              ("" === value
                ? attrName
                : attrName + '="' + escapeAttr(attrValue) + '"'));
        }
        return text;
      })(elCtx, props);
    let classStr = stringifyClass(
      (_a2 = props.class) != null ? _a2 : props.className
    );
    if (
      hostCtx &&
      (hostCtx.$scopeIds$ &&
        (classStr = hostCtx.$scopeIds$.join(" ") + " " + classStr),
      !hostCtx.$attachedListeners$)
    ) {
      hostCtx.$attachedListeners$ = true;
      for (const eventName of Object.keys(hostCtx.li)) {
        addQRLListener(elCtx.li, eventName, hostCtx.li[eventName]);
      }
    }
    isHead && (flags |= 1),
      (classStr = classStr.trim()),
      classStr && (openingElement += ' class="' + classStr + '"');
    const listeners = Object.keys(elCtx.li);
    for (const key2 of listeners) {
      openingElement +=
        " " + key2 + '="' + serializeQRLs(elCtx.li[key2], elCtx) + '"';
    }
    if (
      (null != key && (openingElement += ' q:key="' + key + '"'),
      "ref" in props || listeners.length > 0)
    ) {
      const newID = getNextIndex(ssrCtx.rctx);
      (openingElement += ' q:id="' + newID + '"'),
        (elCtx.$id$ = newID),
        ssrCtx.$contexts$.push(elCtx);
    }
    if (
      (1 & flags && (openingElement += " q:head"),
      (openingElement += ">"),
      stream.write(openingElement),
      emptyElements[tagName])
    ) {
      return;
    }
    const innerHTML = props.dangerouslySetInnerHTML;
    if (null != innerHTML) {
      return (
        stream.write(String(innerHTML)), void stream.write(`</${tagName}>`)
      );
    }
    isHead || (flags &= -2), "html" === tagName ? (flags |= 4) : (flags &= -5);
    const promise = processData(props.children, ssrCtx, stream, flags);
    return then(promise, () => {
      if (isHead) {
        for (const node2 of ssrCtx.headNodes) {
          renderNodeElementSync(node2.type, node2.props, stream);
        }
        ssrCtx.headNodes.length = 0;
      }
      if (beforeClose) {
        return then(beforeClose(stream), () => {
          stream.write(`</${tagName}>`);
        });
      }
      stream.write(`</${tagName}>`);
    });
  }
  if (tagName === Virtual) {
    const elCtx = createContext(111);
    return renderNodeVirtual(
      node,
      elCtx,
      void 0,
      ssrCtx,
      stream,
      flags,
      beforeClose
    );
  }
  if (tagName === SSRComment) {
    return void stream.write("<!--" + node.props.data + "-->");
  }
  if (tagName === InternalSSRStream) {
    return (async (node2, ssrCtx2, stream2, flags2) => {
      stream2.write("<!--qkssr-f-->");
      const generator = node2.props.children;
      let value;
      if (isFunction(generator)) {
        const v = generator({
          write(chunk) {
            stream2.write(chunk), stream2.write("<!--qkssr-f-->");
          },
        });
        if (isPromise(v)) {
          return v;
        }
        value = v;
      } else {
        value = generator;
      }
      for await (const chunk of value) {
        await processData(chunk, ssrCtx2, stream2, flags2, void 0),
          stream2.write("<!--qkssr-f-->");
      }
    })(node, ssrCtx, stream, flags);
  }
  const res = invoke(ssrCtx.invocationContext, tagName, node.props, node.key);
  return processData(res, ssrCtx, stream, flags, beforeClose);
};
const processData = (node, ssrCtx, stream, flags, beforeClose) => {
  if (null != node && "boolean" != typeof node) {
    if (isString(node) || "number" == typeof node) {
      stream.write(escapeHtml(String(node)));
    } else {
      if (isJSXNode(node)) {
        return renderNode(node, ssrCtx, stream, flags, beforeClose);
      }
      if (isArray(node)) {
        return walkChildren(node, ssrCtx, stream, flags);
      }
      if (isPromise(node)) {
        return (
          stream.write("<!--qkssr-f-->"),
          node.then((node2) =>
            processData(node2, ssrCtx, stream, flags, beforeClose)
          )
        );
      }
    }
  }
};
function walkChildren(children, ssrContext, stream, flags) {
  if (null == children) {
    return;
  }
  if (!isArray(children)) {
    return processData(children, ssrContext, stream, flags);
  }
  if (1 === children.length) {
    return processData(children[0], ssrContext, stream, flags);
  }
  if (0 === children.length) {
    return;
  }
  let currentIndex = 0;
  const buffers = [];
  return children.reduce((prevPromise, child, index2) => {
    const buffer = [];
    buffers.push(buffer);
    const rendered = processData(
      child,
      ssrContext,
      prevPromise
        ? {
            write(chunk) {
              currentIndex === index2
                ? stream.write(chunk)
                : buffer.push(chunk);
            },
          }
        : stream,
      flags
    );
    return isPromise(rendered) || prevPromise
      ? then(rendered, () =>
          then(prevPromise, () => {
            currentIndex++,
              buffers.length > currentIndex &&
                buffers[currentIndex].forEach((chunk) => stream.write(chunk));
          })
        )
      : void currentIndex++;
  }, void 0);
}
const flatVirtualChildren = (children, ssrCtx) => {
  if (null == children) {
    return null;
  }
  const result = _flatVirtualChildren(children, ssrCtx);
  const nodes = isArray(result) ? result : [result];
  return 0 === nodes.length ? null : nodes;
};
const stringifyClass = (str) => {
  if (!str) {
    return "";
  }
  if ("string" == typeof str) {
    return str;
  }
  if (Array.isArray(str)) {
    return str.join(" ");
  }
  const output = [];
  for (const key in str) {
    Object.prototype.hasOwnProperty.call(str, key) &&
      str[key] &&
      output.push(key);
  }
  return output.join(" ");
};
const _flatVirtualChildren = (children, ssrCtx) => {
  if (null == children) {
    return null;
  }
  if (isArray(children)) {
    return children.flatMap((c) => _flatVirtualChildren(c, ssrCtx));
  }
  if (
    isJSXNode(children) &&
    isFunction(children.type) &&
    children.type !== SSRComment &&
    children.type !== InternalSSRStream &&
    children.type !== Virtual
  ) {
    const res = invoke(
      ssrCtx.invocationContext,
      children.type,
      children.props,
      children.key
    );
    return flatVirtualChildren(res, ssrCtx);
  }
  return children;
};
const setComponentProps = (rctx, ctx, expectProps) => {
  const keys = Object.keys(expectProps);
  if (0 === keys.length) {
    return;
  }
  const target = {};
  ctx.$props$ = createProps(target, rctx.$static$.$containerState$);
  for (const key of keys) {
    "children" !== key &&
      "q:renderFn" !== key &&
      (target[key] = expectProps[key]);
  }
};
function processPropKey(prop) {
  return "htmlFor" === prop ? "for" : prop;
}
function processPropValue(prop, value) {
  return "style" === prop
    ? stringifyStyle(value)
    : false === value || null == value
    ? null
    : true === value
    ? ""
    : String(value);
}
const emptyElements = {
  area: true,
  base: true,
  basefont: true,
  bgsound: true,
  br: true,
  col: true,
  embed: true,
  frame: true,
  hr: true,
  img: true,
  input: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true,
};
const ESCAPE_HTML = /[&<>]/g;
const ESCAPE_ATTRIBUTES = /[&"]/g;
const escapeHtml = (s) =>
  s.replace(ESCAPE_HTML, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      default:
        return "";
    }
  });
const escapeAttr = (s) =>
  s.replace(ESCAPE_ATTRIBUTES, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      default:
        return "";
    }
  });
const useStore = (initialState, opts) => {
  var _a2;
  const { get, set, ctx } = useSequentialScope();
  if (null != get) {
    return get;
  }
  const value = isFunction(initialState) ? initialState() : initialState;
  if (false === (opts == null ? void 0 : opts.reactive)) {
    return set(value), value;
  }
  {
    const containerState = ctx.$renderCtx$.$static$.$containerState$;
    const newStore = createProxy(
      value,
      containerState,
      ((_a2 = opts == null ? void 0 : opts.recursive) != null ? _a2 : false)
        ? 1
        : 0,
      void 0
    );
    return set(newStore), newStore;
  }
};
function useEnvData(key, defaultValue) {
  var _a2;
  return (_a2 =
    useInvokeContext().$renderCtx$.$static$.$containerState$.$envData$[key]) !=
    null
    ? _a2
    : defaultValue;
}
const MenuIcon = () =>
  /* @__PURE__ */ jsx("svg", {
    fill: "#000000",
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 50 50",
    width: "30px",
    height: "30px",
    children: /* @__PURE__ */ jsx("path", {
      d: "M 0 7.5 L 0 12.5 L 50 12.5 L 50 7.5 Z M 0 22.5 L 0 27.5 L 50 27.5 L 50 22.5 Z M 0 37.5 L 0 42.5 L 50 42.5 L 50 37.5 Z",
    }),
  });
const Header = /* @__PURE__ */ componentQrl(
  inlinedQrl(() => {
    const toggleMenu = inlinedQrl(() => {
      const navbarItem = document.getElementsByClassName("navbar-item");
      for (let i = 0; i < navbarItem.length; i++)
        navbarItem[i].classList.toggle("show");
    }, "s_U36di84Xmj0");
    return /* @__PURE__ */ jsx("header", {
      children: /* @__PURE__ */ jsx("nav", {
        children: /* @__PURE__ */ jsx("ul", {
          class: "navbar-list",
          children: [
            /* @__PURE__ */ jsx("li", {
              class: "logo",
              children: /* @__PURE__ */ jsx("a", {
                href: "#",
                children: "Qwiktober 2022",
              }),
            }),
            /* @__PURE__ */ jsx("li", {
              class: "toggle",
              onClick$: toggleMenu,
              children: /* @__PURE__ */ jsx(MenuIcon, {}),
            }),
            /* @__PURE__ */ jsx("li", {
              class: "navbar-item",
              children: /* @__PURE__ */ jsx("a", {
                href: "/",
                class: "navbar-link",
                children: "Explore",
              }),
            }),
            /* @__PURE__ */ jsx("li", {
              class: "navbar-item",
              children: /* @__PURE__ */ jsx("a", {
                href: "/",
                class: "navbar-link",
                children: "Resources",
              }),
            }),
          ],
        }),
      }),
    });
  }, "s_ceU05TscGYE")
);
const layout = /* @__PURE__ */ componentQrl(
  inlinedQrl(() => {
    return /* @__PURE__ */ jsx(Fragment, {
      children: [
        /* @__PURE__ */ jsx(Header, {}),
        /* @__PURE__ */ jsx("main", {
          children: /* @__PURE__ */ jsx("div", {
            id: "content",
            children: /* @__PURE__ */ jsx(Slot, {}),
          }),
        }),
        /* @__PURE__ */ jsx("footer", {
          children: /* @__PURE__ */ jsx("p", {
            children: "IDN Hacktoberfest \xA9 2022.",
          }),
        }),
      ],
    });
  }, "s_VkLNXphUh5s")
);
const Layout_ = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ Object.defineProperty(
    {
      __proto__: null,
      default: layout,
    },
    Symbol.toStringTag,
    { value: "Module" }
  )
);
const GithubLogo = () =>
  /* @__PURE__ */ jsx("svg", {
    fill: "#000000",
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 30 30",
    width: "30px",
    height: "30px",
    children: /* @__PURE__ */ jsx("path", {
      d: "M15,3C8.373,3,3,8.373,3,15c0,5.623,3.872,10.328,9.092,11.63C12.036,26.468,12,26.28,12,26.047v-2.051 c-0.487,0-1.303,0-1.508,0c-0.821,0-1.551-0.353-1.905-1.009c-0.393-0.729-0.461-1.844-1.435-2.526 c-0.289-0.227-0.069-0.486,0.264-0.451c0.615,0.174,1.125,0.596,1.605,1.222c0.478,0.627,0.703,0.769,1.596,0.769 c0.433,0,1.081-0.025,1.691-0.121c0.328-0.833,0.895-1.6,1.588-1.962c-3.996-0.411-5.903-2.399-5.903-5.098 c0-1.162,0.495-2.286,1.336-3.233C9.053,10.647,8.706,8.73,9.435,8c1.798,0,2.885,1.166,3.146,1.481C13.477,9.174,14.461,9,15.495,9 c1.036,0,2.024,0.174,2.922,0.483C18.675,9.17,19.763,8,21.565,8c0.732,0.731,0.381,2.656,0.102,3.594 c0.836,0.945,1.328,2.066,1.328,3.226c0,2.697-1.904,4.684-5.894,5.097C18.199,20.49,19,22.1,19,23.313v2.734 c0,0.104-0.023,0.179-0.035,0.268C23.641,24.676,27,20.236,27,15C27,8.373,21.627,3,15,3z",
    }),
  });
const InstagramLogo = () =>
  /* @__PURE__ */ jsx("svg", {
    fill: "#000000",
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 64 64",
    width: "30px",
    height: "30px",
    children: /* @__PURE__ */ jsx("path", {
      d: "M 31.820312 12 C 13.438312 12 12 13.439312 12 31.820312 L 12 32.179688 C 12 50.560688 13.438313 52 31.820312 52 L 32.179688 52 C 50.561688 52 52 50.560688 52 32.179688 L 52 32 C 52 13.452 50.548 12 32 12 L 31.820312 12 z M 43.994141 18 C 45.099141 17.997 45.997 18.889141 46 19.994141 C 46.003 21.099141 45.110859 21.997 44.005859 22 C 42.900859 22.003 42.003 21.110859 42 20.005859 C 41.997 18.900859 42.889141 18.003 43.994141 18 z M 31.976562 22 C 37.498562 21.987 41.987 26.454563 42 31.976562 C 42.013 37.498562 37.545437 41.987 32.023438 42 C 26.501437 42.013 22.013 37.545437 22 32.023438 C 21.987 26.501437 26.454563 22.013 31.976562 22 z M 31.986328 26 C 28.672328 26.008 25.992 28.701625 26 32.015625 C 26.008 35.328625 28.700672 38.008 32.013672 38 C 35.327672 37.992 38.008 35.299328 38 31.986328 C 37.992 28.672328 35.299328 25.992 31.986328 26 z",
    }),
  });
const LinkedinLogo = () =>
  /* @__PURE__ */ jsx("svg", {
    fill: "#000000",
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 50 50",
    width: "30px",
    height: "30px",
    children: [
      " ",
      /* @__PURE__ */ jsx("path", {
        d: "M25,2C12.318,2,2,12.317,2,25s10.318,23,23,23s23-10.317,23-23S37.682,2,25,2z M18,35h-4V20h4V35z M16,17 c-1.105,0-2-0.895-2-2c0-1.105,0.895-2,2-2s2,0.895,2,2C18,16.105,17.105,17,16,17z M37,35h-4v-5v-2.5c0-1.925-1.575-3.5-3.5-3.5 S26,25.575,26,27.5V35h-4V20h4v1.816C27.168,20.694,28.752,20,30.5,20c3.59,0,6.5,2.91,6.5,6.5V35z",
      }),
    ],
  });
const ProfileCard = /* @__PURE__ */ componentQrl(
  inlinedQrl(
    ({
      fullname,
      image,
      githubUsername,
      instagramUsername,
      linkedinUsername,
    }) => {
      return /* @__PURE__ */ jsx(Fragment, {
        children: /* @__PURE__ */ jsx("div", {
          class: "biography-card",
          "data-aos": "fade-up",
          "data-aos-duration": "2000",
          children: [
            /* @__PURE__ */ jsx("figure", {
              children: /* @__PURE__ */ jsx("img", {
                src: image
                  ? image
                  : `https://www.github.com/${githubUsername}.png?size=300`,
                height: "300",
                width: "300",
                alt: "Profile",
                class: "profile-img",
              }),
            }),
            /* @__PURE__ */ jsx("h3", {
              children: fullname,
            }),
            /* @__PURE__ */ jsx("div", {
              class: "contact",
              children: [
                /* @__PURE__ */ jsx("a", {
                  class: "social-media",
                  href: `https://www.github.com/${githubUsername}`,
                  target: "_blank",
                  children: /* @__PURE__ */ jsx(GithubLogo, {}),
                }),
                instagramUsername &&
                  /* @__PURE__ */ jsx("a", {
                    class: "social-media",
                    href: `https://www.instagram.com/${instagramUsername}`,
                    target: "_blank",
                    children: /* @__PURE__ */ jsx(InstagramLogo, {}),
                  }),
                linkedinUsername &&
                  /* @__PURE__ */ jsx("a", {
                    class: "social-media",
                    href: `https://www.linkedin.com/in/${linkedinUsername}`,
                    target: "_blank",
                    children: /* @__PURE__ */ jsx(LinkedinLogo, {}),
                  }),
              ],
            }),
          ],
        }),
      });
    },
    "s_2ivu5Sivbf0"
  )
);
const FirstMarquee = /* @__PURE__ */ componentQrl(
  inlinedQrl(() => {
    return /* @__PURE__ */ jsx("marquee", {
      width: "100%",
      direction: "right",
      class: "blink",
      scrollamount: "25",
      behavior: "scroll",
      children: /* @__PURE__ */ jsx("h2", {
        children:
          "LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022 LAUNCH SEQUENCE INITIATED \u2022 IT'S TIME TO HACK \u2022",
      }),
    });
  }, "s_WecD0DfE8gs")
);
const SecondMarquee = /* @__PURE__ */ componentQrl(
  inlinedQrl(() => {
    return /* @__PURE__ */ jsx("marquee", {
      width: "100%",
      direction: "left",
      class: "blink",
      scrollamount: "25",
      behavior: "scroll",
      children: /* @__PURE__ */ jsx("h2", {
        children:
          "GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022 GET IN THE REPO, HACKER! \u2022",
      }),
    });
  }, "s_ACA0Fav3IHM")
);
const Hero = /* @__PURE__ */ componentQrl(
  inlinedQrl(() => {
    return /* @__PURE__ */ jsx("article", {
      children: /* @__PURE__ */ jsx("section", {
        class: "title",
        children: /* @__PURE__ */ jsx("div", {
          class: "title-container",
          children: [
            /* @__PURE__ */ jsx("div", {
              class: "hero",
              children: /* @__PURE__ */ jsx("img", {
                src: "images/idn-landscape.gif",
                class: "hero-img",
                alt: "Hero Image",
              }),
            }),
            /* @__PURE__ */ jsx("div", {
              class: "big-heading",
              children: [
                /* @__PURE__ */ jsx("h1", {
                  children: "Qwiktober 2022",
                }),
                /* @__PURE__ */ jsx("p", {
                  style: "color: white",
                  children:
                    "HACKTOBERFEST IS FOR EVERYONE. WHETHER IT'S YOUR FIRST TIME\u2014OR YOUR NINTH\u2014IT'S ALMOST TIME TO HACK OUT FOUR PRISTINE PULL/MERGE REQUESTS AND COMPLETE YOUR MISSION FOR OPEN SOURCE.",
                }),
                /* @__PURE__ */ jsx("button", {
                  class: "explore-button",
                  children: /* @__PURE__ */ jsx("a", {
                    href: "/",
                    children: "Explore",
                  }),
                }),
              ],
            }),
          ],
        }),
      }),
    });
  }, "s_v0Tdhkf3cbY")
);
const index = /* @__PURE__ */ componentQrl(
  inlinedQrl(() => {
    return /* @__PURE__ */ jsx("div", {
      children: [
        /* @__PURE__ */ jsx(Hero, {}),
        /* @__PURE__ */ jsx("article", {
          children: /* @__PURE__ */ jsx("section", {
            class: "collection",
            children: [
              /* @__PURE__ */ jsx(FirstMarquee, {}),
              /* @__PURE__ */ jsx(SecondMarquee, {}),
              /* @__PURE__ */ jsx("div", {
                class: "collection-container",
                children: /* @__PURE__ */ jsx(ProfileCard, {
                  fullname: "Imamuzzaki Abu Salam",
                  image: "",
                  githubUsername: "ImBIOS",
                  instagramUsername: "imamdev_",
                  linkedinUsername: "imamuzzaki-abu-salam",
                }),
              }),
            ],
          }),
        }),
      ],
    });
  }, "s_xYL1qOwPyDI")
);
const head = {
  title: "Qwiktober 2022yy",
};
const Index = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ Object.defineProperty(
    {
      __proto__: null,
      default: index,
      head,
    },
    Symbol.toStringTag,
    { value: "Module" }
  )
);
const Layout = () => Layout_;
const routes = [
  [
    /^\/$/,
    [Layout, () => Index],
    void 0,
    "/",
    ["q-959a2884.js", "q-6916d310.js"],
  ],
];
const menus = [];
const trailingSlash = false;
const basePathname = "/";
const cacheModules = true;
const _qwikCityPlan = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ Object.defineProperty(
    {
      __proto__: null,
      routes,
      menus,
      trailingSlash,
      basePathname,
      cacheModules,
    },
    Symbol.toStringTag,
    { value: "Module" }
  )
);
var HEADERS = Symbol("headers");
var _a;
var HeadersPolyfill = class {
  constructor() {
    this[_a] = {};
  }
  [((_a = HEADERS), Symbol.iterator)]() {
    return this.entries();
  }
  *keys() {
    for (const name of Object.keys(this[HEADERS])) {
      yield name;
    }
  }
  *values() {
    for (const value of Object.values(this[HEADERS])) {
      yield value;
    }
  }
  *entries() {
    for (const name of Object.keys(this[HEADERS])) {
      yield [name, this.get(name)];
    }
  }
  get(name) {
    return this[HEADERS][normalizeHeaderName(name)] || null;
  }
  set(name, value) {
    const normalizedName = normalizeHeaderName(name);
    this[HEADERS][normalizedName] =
      typeof value !== "string" ? String(value) : value;
  }
  append(name, value) {
    const normalizedName = normalizeHeaderName(name);
    const resolvedValue = this.has(normalizedName)
      ? `${this.get(normalizedName)}, ${value}`
      : value;
    this.set(name, resolvedValue);
  }
  delete(name) {
    if (!this.has(name)) {
      return;
    }
    const normalizedName = normalizeHeaderName(name);
    delete this[HEADERS][normalizedName];
  }
  all() {
    return this[HEADERS];
  }
  has(name) {
    return this[HEADERS].hasOwnProperty(normalizeHeaderName(name));
  }
  forEach(callback, thisArg) {
    for (const name in this[HEADERS]) {
      if (this[HEADERS].hasOwnProperty(name)) {
        callback.call(thisArg, this[HEADERS][name], name, this);
      }
    }
  }
};
var HEADERS_INVALID_CHARACTERS = /[^a-z0-9\-#$%&'*+.^_`|~]/i;
function normalizeHeaderName(name) {
  if (typeof name !== "string") {
    name = String(name);
  }
  if (HEADERS_INVALID_CHARACTERS.test(name) || name.trim() === "") {
    throw new TypeError("Invalid character in header field name");
  }
  return name.toLowerCase();
}
function createHeaders() {
  return new (typeof Headers === "function" ? Headers : HeadersPolyfill)();
}
var ErrorResponse = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
};
function notFoundHandler(requestCtx) {
  return errorResponse(requestCtx, new ErrorResponse(404, "Not Found"));
}
function errorHandler(requestCtx, e) {
  const status = 500;
  let message = "Server Error";
  let stack = void 0;
  if (e != null) {
    if (typeof e === "object") {
      if (typeof e.message === "string") {
        message = e.message;
      }
      if (e.stack != null) {
        stack = String(e.stack);
      }
    } else {
      message = String(e);
    }
  }
  const html = minimalHtmlResponse(status, message, stack);
  const headers = createHeaders();
  headers.set("Content-Type", "text/html; charset=utf-8");
  return requestCtx.response(
    status,
    headers,
    async (stream) => {
      stream.write(html);
    },
    e
  );
}
function errorResponse(requestCtx, errorResponse2) {
  const html = minimalHtmlResponse(
    errorResponse2.status,
    errorResponse2.message,
    errorResponse2.stack
  );
  const headers = createHeaders();
  headers.set("Content-Type", "text/html; charset=utf-8");
  return requestCtx.response(
    errorResponse2.status,
    headers,
    async (stream) => {
      stream.write(html);
    },
    errorResponse2
  );
}
function minimalHtmlResponse(status, message, stack) {
  const width = typeof message === "string" ? "600px" : "300px";
  const color = status >= 500 ? COLOR_500 : COLOR_400;
  if (status < 500) {
    stack = "";
  }
  return `<!DOCTYPE html>
<html data-qwik-city-status="${status}">
<head>
  <meta charset="utf-8">
  <title>${status} ${message}</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { color: ${color}; background-color: #fafafa; padding: 30px; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Roboto, sans-serif; }
    p { max-width: ${width}; margin: 60px auto 30px auto; background: white; border-radius: 4px; box-shadow: 0px 0px 50px -20px ${color}; overflow: hidden; }
    strong { display: inline-block; padding: 15px; background: ${color}; color: white; }
    span { display: inline-block; padding: 15px; }
    pre { max-width: 580px; margin: 0 auto; }
  </style>
</head>
<body>
  <p>
    <strong>${status}</strong>
    <span>${message}</span>
  </p>
  ${stack ? `<pre><code>${stack}</code></pre>` : ``}
</body>
</html>
`;
}
var COLOR_400 = "#006ce9";
var COLOR_500 = "#713fc2";
var MODULE_CACHE$1 = /* @__PURE__ */ new WeakMap();
var loadRoute$1 = async (routes2, menus2, cacheModules2, pathname) => {
  if (Array.isArray(routes2)) {
    for (const route of routes2) {
      const match = route[0].exec(pathname);
      if (match) {
        const loaders = route[1];
        const params = getRouteParams$1(route[2], match);
        const routeBundleNames = route[4];
        const mods = new Array(loaders.length);
        const pendingLoads = [];
        const menuLoader = getMenuLoader$1(menus2, pathname);
        let menu = void 0;
        loaders.forEach((moduleLoader, i) => {
          loadModule$1(
            moduleLoader,
            pendingLoads,
            (routeModule) => (mods[i] = routeModule),
            cacheModules2
          );
        });
        loadModule$1(
          menuLoader,
          pendingLoads,
          (menuModule) =>
            (menu = menuModule == null ? void 0 : menuModule.default),
          cacheModules2
        );
        if (pendingLoads.length > 0) {
          await Promise.all(pendingLoads);
        }
        return [params, mods, menu, routeBundleNames];
      }
    }
  }
  return null;
};
var loadModule$1 = (
  moduleLoader,
  pendingLoads,
  moduleSetter,
  cacheModules2
) => {
  if (typeof moduleLoader === "function") {
    const loadedModule = MODULE_CACHE$1.get(moduleLoader);
    if (loadedModule) {
      moduleSetter(loadedModule);
    } else {
      const l = moduleLoader();
      if (typeof l.then === "function") {
        pendingLoads.push(
          l.then((loadedModule2) => {
            if (cacheModules2 !== false) {
              MODULE_CACHE$1.set(moduleLoader, loadedModule2);
            }
            moduleSetter(loadedModule2);
          })
        );
      } else if (l) {
        moduleSetter(l);
      }
    }
  }
};
var getMenuLoader$1 = (menus2, pathname) => {
  if (menus2) {
    const menu = menus2.find(
      (m) =>
        m[0] === pathname ||
        pathname.startsWith(m[0] + (pathname.endsWith("/") ? "" : "/"))
    );
    if (menu) {
      return menu[1];
    }
  }
  return void 0;
};
var getRouteParams$1 = (paramNames, match) => {
  const params = {};
  if (paramNames) {
    for (let i = 0; i < paramNames.length; i++) {
      params[paramNames[i]] = match ? match[i + 1] : "";
    }
  }
  return params;
};
var RedirectResponse = class {
  constructor(url, status, headers) {
    this.url = url;
    this.location = url;
    this.status = isRedirectStatus(status) ? status : 307;
    this.headers = headers || createHeaders();
    this.headers.set("Location", this.location);
    this.headers.delete("Cache-Control");
  }
};
function redirectResponse(requestCtx, responseRedirect) {
  return requestCtx.response(
    responseRedirect.status,
    responseRedirect.headers,
    async () => {}
  );
}
function isRedirectStatus(status) {
  return typeof status === "number" && status >= 301 && status <= 308;
}
async function loadUserResponse(
  requestCtx,
  params,
  routeModules,
  platform,
  trailingSlash2,
  basePathname2 = "/"
) {
  if (routeModules.length === 0) {
    throw new ErrorResponse(404, `Not Found`);
  }
  const { request, url } = requestCtx;
  const { pathname } = url;
  const isPageModule = isLastModulePageRoute(routeModules);
  const isPageDataRequest =
    isPageModule && request.headers.get("Accept") === "application/json";
  const type = isPageDataRequest
    ? "pagedata"
    : isPageModule
    ? "pagehtml"
    : "endpoint";
  const userResponse = {
    type,
    url,
    params,
    status: 200,
    headers: createHeaders(),
    resolvedBody: void 0,
    pendingBody: void 0,
    aborted: false,
  };
  let hasRequestMethodHandler = false;
  if (isPageModule && pathname !== basePathname2) {
    if (trailingSlash2) {
      if (!pathname.endsWith("/")) {
        throw new RedirectResponse(pathname + "/" + url.search, 307);
      }
    } else {
      if (pathname.endsWith("/")) {
        throw new RedirectResponse(
          pathname.slice(0, pathname.length - 1) + url.search,
          307
        );
      }
    }
  }
  let routeModuleIndex = -1;
  const abort = () => {
    routeModuleIndex = ABORT_INDEX;
  };
  const redirect = (url2, status) => {
    return new RedirectResponse(url2, status, userResponse.headers);
  };
  const error = (status, message) => {
    return new ErrorResponse(status, message);
  };
  const next = async () => {
    routeModuleIndex++;
    while (routeModuleIndex < routeModules.length) {
      const endpointModule = routeModules[routeModuleIndex];
      let reqHandler = void 0;
      switch (request.method) {
        case "GET": {
          reqHandler = endpointModule.onGet;
          break;
        }
        case "POST": {
          reqHandler = endpointModule.onPost;
          break;
        }
        case "PUT": {
          reqHandler = endpointModule.onPut;
          break;
        }
        case "PATCH": {
          reqHandler = endpointModule.onPatch;
          break;
        }
        case "OPTIONS": {
          reqHandler = endpointModule.onOptions;
          break;
        }
        case "HEAD": {
          reqHandler = endpointModule.onHead;
          break;
        }
        case "DELETE": {
          reqHandler = endpointModule.onDelete;
          break;
        }
      }
      reqHandler = reqHandler || endpointModule.onRequest;
      if (typeof reqHandler === "function") {
        hasRequestMethodHandler = true;
        const response = {
          get status() {
            return userResponse.status;
          },
          set status(code) {
            userResponse.status = code;
          },
          get headers() {
            return userResponse.headers;
          },
          redirect,
          error,
        };
        const requestEv = {
          request,
          url: new URL(url),
          params: { ...params },
          response,
          platform,
          next,
          abort,
        };
        const syncData = reqHandler(requestEv);
        if (typeof syncData === "function") {
          userResponse.pendingBody = createPendingBody(syncData);
        } else if (
          syncData !== null &&
          typeof syncData === "object" &&
          typeof syncData.then === "function"
        ) {
          const asyncResolved = await syncData;
          if (typeof asyncResolved === "function") {
            userResponse.pendingBody = createPendingBody(asyncResolved);
          } else {
            userResponse.resolvedBody = asyncResolved;
          }
        } else {
          userResponse.resolvedBody = syncData;
        }
      }
      routeModuleIndex++;
    }
  };
  await next();
  userResponse.aborted = routeModuleIndex >= ABORT_INDEX;
  if (
    !isPageDataRequest &&
    isRedirectStatus(userResponse.status) &&
    userResponse.headers.has("Location")
  ) {
    throw new RedirectResponse(
      userResponse.headers.get("Location"),
      userResponse.status,
      userResponse.headers
    );
  }
  if (type === "endpoint" && !hasRequestMethodHandler) {
    throw new ErrorResponse(405, `Method Not Allowed`);
  }
  return userResponse;
}
function createPendingBody(cb) {
  return new Promise((resolve, reject) => {
    try {
      const rtn = cb();
      if (
        rtn !== null &&
        typeof rtn === "object" &&
        typeof rtn.then === "function"
      ) {
        rtn.then(resolve, reject);
      } else {
        resolve(rtn);
      }
    } catch (e) {
      reject(e);
    }
  });
}
function isLastModulePageRoute(routeModules) {
  const lastRouteModule = routeModules[routeModules.length - 1];
  return lastRouteModule && typeof lastRouteModule.default === "function";
}
function updateRequestCtx(requestCtx, trailingSlash2) {
  let pathname = requestCtx.url.pathname;
  if (pathname.endsWith(QDATA_JSON)) {
    requestCtx.request.headers.set("Accept", "application/json");
    const trimEnd = pathname.length - QDATA_JSON_LEN + (trailingSlash2 ? 1 : 0);
    pathname = pathname.slice(0, trimEnd);
    if (pathname === "") {
      pathname = "/";
    }
    requestCtx.url.pathname = pathname;
  }
}
var QDATA_JSON = "/q-data.json";
var QDATA_JSON_LEN = QDATA_JSON.length;
var ABORT_INDEX = 999999999;
function endpointHandler(requestCtx, userResponse) {
  const { pendingBody, resolvedBody, status, headers } = userResponse;
  const { response } = requestCtx;
  if (pendingBody === void 0 && resolvedBody === void 0) {
    return response(status, headers, asyncNoop);
  }
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }
  const isJson = headers.get("Content-Type").includes("json");
  return response(status, headers, async ({ write }) => {
    const body = pendingBody !== void 0 ? await pendingBody : resolvedBody;
    if (body !== void 0) {
      if (isJson) {
        write(JSON.stringify(body));
      } else {
        const type = typeof body;
        if (type === "string") {
          write(body);
        } else if (type === "number" || type === "boolean") {
          write(String(body));
        } else {
          write(body);
        }
      }
    }
  });
}
var asyncNoop = async () => {};
function pageHandler(
  requestCtx,
  userResponse,
  render2,
  opts,
  routeBundleNames
) {
  const { status, headers } = userResponse;
  const { response } = requestCtx;
  const isPageData = userResponse.type === "pagedata";
  if (isPageData) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  } else if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "text/html; charset=utf-8");
  }
  return response(isPageData ? 200 : status, headers, async (stream) => {
    const result = await render2({
      stream: isPageData ? noopStream : stream,
      envData: getQwikCityEnvData(userResponse),
      ...opts,
    });
    if (isPageData) {
      stream.write(
        JSON.stringify(
          await getClientPageData(userResponse, result, routeBundleNames)
        )
      );
    } else {
      if ((typeof result).html === "string") {
        stream.write(result.html);
      }
    }
    if (typeof stream.clientData === "function") {
      stream.clientData(
        await getClientPageData(userResponse, result, routeBundleNames)
      );
    }
  });
}
async function getClientPageData(userResponse, result, routeBundleNames) {
  const prefetchBundleNames = getPrefetchBundleNames(result, routeBundleNames);
  const clientPage = {
    body: userResponse.pendingBody
      ? await userResponse.pendingBody
      : userResponse.resolvedBody,
    status: userResponse.status !== 200 ? userResponse.status : void 0,
    redirect:
      (userResponse.status >= 301 &&
        userResponse.status <= 308 &&
        userResponse.headers.get("location")) ||
      void 0,
    prefetch: prefetchBundleNames.length > 0 ? prefetchBundleNames : void 0,
  };
  return clientPage;
}
function getPrefetchBundleNames(result, routeBundleNames) {
  const bundleNames = [];
  const addBundle2 = (bundleName) => {
    if (bundleName && !bundleNames.includes(bundleName)) {
      bundleNames.push(bundleName);
    }
  };
  const addPrefetchResource = (prefetchResources) => {
    if (Array.isArray(prefetchResources)) {
      for (const prefetchResource of prefetchResources) {
        const bundleName = prefetchResource.url.split("/").pop();
        if (bundleName && !bundleNames.includes(bundleName)) {
          addBundle2(bundleName);
          addPrefetchResource(prefetchResource.imports);
        }
      }
    }
  };
  addPrefetchResource(result.prefetchResources);
  const manifest2 = result.manifest || result._manifest;
  const renderedSymbols = result._symbols;
  if (manifest2 && renderedSymbols) {
    for (const renderedSymbolName of renderedSymbols) {
      const symbol = manifest2.symbols[renderedSymbolName];
      if (symbol && symbol.ctxName === "component$") {
        addBundle2(manifest2.mapping[renderedSymbolName]);
      }
    }
  }
  if (routeBundleNames) {
    for (const routeBundleName of routeBundleNames) {
      addBundle2(routeBundleName);
    }
  }
  return bundleNames;
}
function getQwikCityEnvData(userResponse) {
  const { url, params, pendingBody, resolvedBody, status } = userResponse;
  return {
    url: url.href,
    qwikcity: {
      params: { ...params },
      response: {
        body: pendingBody || resolvedBody,
        status,
      },
    },
  };
}
var noopStream = { write: () => {} };
async function requestHandler(requestCtx, render2, platform, opts) {
  try {
    updateRequestCtx(requestCtx, trailingSlash);
    const loadedRoute = await loadRoute$1(
      routes,
      menus,
      cacheModules,
      requestCtx.url.pathname
    );
    if (loadedRoute) {
      const [params, mods, _, routeBundleNames] = loadedRoute;
      const userResponse = await loadUserResponse(
        requestCtx,
        params,
        mods,
        platform,
        trailingSlash,
        basePathname
      );
      if (userResponse.aborted) {
        return null;
      }
      if (userResponse.type === "endpoint") {
        return endpointHandler(requestCtx, userResponse);
      }
      return pageHandler(
        requestCtx,
        userResponse,
        render2,
        opts,
        routeBundleNames
      );
    }
  } catch (e) {
    if (e instanceof RedirectResponse) {
      return redirectResponse(requestCtx, e);
    }
    if (e instanceof ErrorResponse) {
      return errorResponse(requestCtx, e);
    }
    return errorHandler(requestCtx, e);
  }
  return null;
}
function qwikCity(render2, opts) {
  async function onRequest(request, { next }) {
    try {
      const requestCtx = {
        url: new URL(request.url),
        request,
        response: (status, headers, body) => {
          return new Promise((resolve) => {
            let flushedHeaders = false;
            const { readable, writable } = new TransformStream();
            const writer = writable.getWriter();
            const response = new Response(readable, { status, headers });
            body({
              write: (chunk) => {
                if (!flushedHeaders) {
                  flushedHeaders = true;
                  resolve(response);
                }
                if (typeof chunk === "string") {
                  const encoder = new TextEncoder();
                  writer.write(encoder.encode(chunk));
                } else {
                  writer.write(chunk);
                }
              },
            }).finally(() => {
              if (!flushedHeaders) {
                flushedHeaders = true;
                resolve(response);
              }
              writer.close();
            });
          });
        },
      };
      const handledResponse = await requestHandler(
        requestCtx,
        render2,
        {},
        opts
      );
      if (handledResponse) {
        return handledResponse;
      }
      const nextResponse = await next();
      if (nextResponse.status === 404) {
        const handledResponse2 = await requestHandler(
          requestCtx,
          render2,
          {},
          opts
        );
        if (handledResponse2) {
          return handledResponse2;
        }
        const notFoundResponse = await notFoundHandler(requestCtx);
        return notFoundResponse;
      }
      return nextResponse;
    } catch (e) {
      return new Response(String(e || "Error"), {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  }
  return onRequest;
}
/**
 * @license
 * @builder.io/qwik/server 0.9.0
 * Copyright Builder.io, Inc. All Rights Reserved.
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */
if (typeof global == "undefined") {
  const g =
    "undefined" != typeof globalThis
      ? globalThis
      : "undefined" != typeof window
      ? window
      : "undefined" != typeof self
      ? self
      : {};
  g.global = g;
}
var __require = /* @__PURE__ */ ((x) =>
  typeof require !== "undefined"
    ? require
    : typeof Proxy !== "undefined"
    ? new Proxy(x, {
        get: (a, b) => (typeof require !== "undefined" ? require : a)[b],
      })
    : x)(function (x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw new Error('Dynamic require of "' + x + '" is not supported');
});
function createTimer() {
  if (typeof performance === "undefined") {
    return () => 0;
  }
  const start = performance.now();
  return () => {
    const end = performance.now();
    const delta = end - start;
    return delta / 1e6;
  };
}
function getBuildBase(opts) {
  let base = opts.base;
  if (typeof base === "string") {
    if (!base.endsWith("/")) {
      base += "/";
    }
    return base;
  }
  return "/build/";
}
function createPlatform(opts, resolvedManifest) {
  const mapper = resolvedManifest == null ? void 0 : resolvedManifest.mapper;
  const mapperFn = opts.symbolMapper
    ? opts.symbolMapper
    : (symbolName) => {
        if (mapper) {
          const hash = getSymbolHash(symbolName);
          const result = mapper[hash];
          if (!result) {
            console.error("Cannot resolve symbol", symbolName, "in", mapper);
          }
          return result;
        }
      };
  const serverPlatform = {
    isServer: true,
    async importSymbol(_element, qrl, symbolName) {
      let [modulePath] = String(qrl).split("#");
      if (!modulePath.endsWith(".js")) {
        modulePath += ".js";
      }
      const module = __require(modulePath);
      if (!(symbolName in module)) {
        throw new Error(
          `Q-ERROR: missing symbol '${symbolName}' in module '${modulePath}'.`
        );
      }
      const symbol = module[symbolName];
      return symbol;
    },
    raf: () => {
      console.error("server can not rerender");
      return Promise.resolve();
    },
    nextTick: (fn) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(fn());
        });
      });
    },
    chunkForSymbol(symbolName) {
      return mapperFn(symbolName, mapper);
    },
  };
  return serverPlatform;
}
async function setServerPlatform(opts, manifest2) {
  const platform = createPlatform(opts, manifest2);
  setPlatform(platform);
}
var getSymbolHash = (symbolName) => {
  const index2 = symbolName.lastIndexOf("_");
  if (index2 > -1) {
    return symbolName.slice(index2 + 1);
  }
  return symbolName;
};
var QWIK_LOADER_DEFAULT_MINIFIED =
  '(()=>{function e(e){return"object"==typeof e&&e&&"Module"===e[Symbol.toStringTag]}((t,n)=>{const o="__q_context__",r=window,a=(e,n,o)=>{n=n.replace(/([A-Z])/g,(e=>"-"+e.toLowerCase())),t.querySelectorAll("[on"+e+"\\\\:"+n+"]").forEach((t=>l(t,e,n,o)))},i=(e,t)=>new CustomEvent(e,{detail:t}),s=e=>{throw Error("QWIK "+e)},c=(e,n)=>(e=e.closest("[q\\\\:container]"),new URL(n,new URL(e?e.getAttribute("q:base"):t.baseURI,t.baseURI))),l=async(n,a,l,d)=>{var u;n.hasAttribute("preventdefault:"+l)&&d.preventDefault();const b="on"+a+":"+l,v=null==(u=n._qc_)?void 0:u.li[b];if(v){for(const e of v)await e.getFn([n,d],(()=>n.isConnected))(d,n);return}const p=n.getAttribute(b);if(p)for(const a of p.split("\\n")){const l=c(n,a);if(l){const a=f(l),c=(r[l.pathname]||(w=await import(l.href.split("#")[0]),Object.values(w).find(e)||w))[a]||s(l+" does not export "+a),u=t[o];if(n.isConnected)try{t[o]=[n,d,l],await c(d,n)}finally{t[o]=u,t.dispatchEvent(i("qsymbol",{symbol:a,element:n}))}}}var w},f=e=>e.hash.replace(/^#?([^?[|]*).*$/,"$1")||"default",d=async e=>{let t=e.target;for(a("-document",e.type,e);t&&t.getAttribute;)await l(t,"",e.type,e),t=e.bubbles&&!0!==e.cancelBubble?t.parentElement:null},u=e=>{a("-window",e.type,e)},b=()=>{const e=t.readyState;if(!n&&("interactive"==e||"complete"==e)){n=1,a("","qinit",i("qinit"));const e=t.querySelectorAll("[on\\\\:qvisible]");if(e.length>0){const t=new IntersectionObserver((e=>{for(const n of e)n.isIntersecting&&(t.unobserve(n.target),l(n.target,"","qvisible",i("qvisible",n)))}));e.forEach((e=>t.observe(e)))}}},v=new Set,p=e=>{for(const t of e)v.has(t)||(document.addEventListener(t,d,{capture:!0}),r.addEventListener(t,u),v.add(t))};if(!t.qR){const e=r.qwikevents;Array.isArray(e)&&p(e),r.qwikevents={push:(...e)=>p(e)},t.addEventListener("readystatechange",b),b()}})(document)})();';
var QWIK_LOADER_DEFAULT_DEBUG =
  '(() => {\n    function findModule(module) {\n        return Object.values(module).find(isModule) || module;\n    }\n    function isModule(module) {\n        return "object" == typeof module && module && "Module" === module[Symbol.toStringTag];\n    }\n    ((doc, hasInitialized) => {\n        const win = window;\n        const broadcast = (infix, type, ev) => {\n            type = type.replace(/([A-Z])/g, (a => "-" + a.toLowerCase()));\n            doc.querySelectorAll("[on" + infix + "\\\\:" + type + "]").forEach((target => dispatch(target, infix, type, ev)));\n        };\n        const createEvent = (eventName, detail) => new CustomEvent(eventName, {\n            detail: detail\n        });\n        const error = msg => {\n            throw new Error("QWIK " + msg);\n        };\n        const qrlResolver = (element, qrl) => {\n            element = element.closest("[q\\\\:container]");\n            return new URL(qrl, new URL(element ? element.getAttribute("q:base") : doc.baseURI, doc.baseURI));\n        };\n        const dispatch = async (element, onPrefix, eventName, ev) => {\n            var _a;\n            element.hasAttribute("preventdefault:" + eventName) && ev.preventDefault();\n            const attrName = "on" + onPrefix + ":" + eventName;\n            const qrls = null == (_a = element._qc_) ? void 0 : _a.li[attrName];\n            if (qrls) {\n                for (const q of qrls) {\n                    await q.getFn([ element, ev ], (() => element.isConnected))(ev, element);\n                }\n                return;\n            }\n            const attrValue = element.getAttribute(attrName);\n            if (attrValue) {\n                for (const qrl of attrValue.split("\\n")) {\n                    const url = qrlResolver(element, qrl);\n                    if (url) {\n                        const symbolName = getSymbolName(url);\n                        const handler = (win[url.pathname] || findModule(await import(url.href.split("#")[0])))[symbolName] || error(url + " does not export " + symbolName);\n                        const previousCtx = doc.__q_context__;\n                        if (element.isConnected) {\n                            try {\n                                doc.__q_context__ = [ element, ev, url ];\n                                await handler(ev, element);\n                            } finally {\n                                doc.__q_context__ = previousCtx;\n                                doc.dispatchEvent(createEvent("qsymbol", {\n                                    symbol: symbolName,\n                                    element: element\n                                }));\n                            }\n                        }\n                    }\n                }\n            }\n        };\n        const getSymbolName = url => url.hash.replace(/^#?([^?[|]*).*$/, "$1") || "default";\n        const processDocumentEvent = async ev => {\n            let element = ev.target;\n            broadcast("-document", ev.type, ev);\n            while (element && element.getAttribute) {\n                await dispatch(element, "", ev.type, ev);\n                element = ev.bubbles && !0 !== ev.cancelBubble ? element.parentElement : null;\n            }\n        };\n        const processWindowEvent = ev => {\n            broadcast("-window", ev.type, ev);\n        };\n        const processReadyStateChange = () => {\n            const readyState = doc.readyState;\n            if (!hasInitialized && ("interactive" == readyState || "complete" == readyState)) {\n                hasInitialized = 1;\n                broadcast("", "qinit", createEvent("qinit"));\n                const results = doc.querySelectorAll("[on\\\\:qvisible]");\n                if (results.length > 0) {\n                    const observer = new IntersectionObserver((entries => {\n                        for (const entry of entries) {\n                            if (entry.isIntersecting) {\n                                observer.unobserve(entry.target);\n                                dispatch(entry.target, "", "qvisible", createEvent("qvisible", entry));\n                            }\n                        }\n                    }));\n                    results.forEach((el => observer.observe(el)));\n                }\n            }\n        };\n        const events =  new Set;\n        const push = eventNames => {\n            for (const eventName of eventNames) {\n                if (!events.has(eventName)) {\n                    document.addEventListener(eventName, processDocumentEvent, {\n                        capture: !0\n                    });\n                    win.addEventListener(eventName, processWindowEvent);\n                    events.add(eventName);\n                }\n            }\n        };\n        if (!doc.qR) {\n            const qwikevents = win.qwikevents;\n            Array.isArray(qwikevents) && push(qwikevents);\n            win.qwikevents = {\n                push: (...e) => push(e)\n            };\n            doc.addEventListener("readystatechange", processReadyStateChange);\n            processReadyStateChange();\n        }\n    })(document);\n})();';
var QWIK_LOADER_OPTIMIZE_MINIFIED =
  '(()=>{function e(e){return"object"==typeof e&&e&&"Module"===e[Symbol.toStringTag]}((t,n)=>{const o="__q_context__",r=window,a=(e,n,o)=>{n=n.replace(/([A-Z])/g,(e=>"-"+e.toLowerCase())),t.querySelectorAll("[on"+e+"\\\\:"+n+"]").forEach((t=>l(t,e,n,o)))},i=(e,t)=>new CustomEvent(e,{detail:t}),s=e=>{throw Error("QWIK "+e)},c=(e,n)=>(e=e.closest("[q\\\\:container]"),new URL(n,new URL(e?e.getAttribute("q:base"):t.baseURI,t.baseURI))),l=async(n,a,l,d)=>{var u;n.hasAttribute("preventdefault:"+l)&&d.preventDefault();const b="on"+a+":"+l,v=null==(u=n._qc_)?void 0:u.li[b];if(v){for(const e of v)await e.getFn([n,d],(()=>n.isConnected))(d,n);return}const p=n.getAttribute(b);if(p)for(const a of p.split("\\n")){const l=c(n,a);if(l){const a=f(l),c=(r[l.pathname]||(w=await import(l.href.split("#")[0]),Object.values(w).find(e)||w))[a]||s(l+" does not export "+a),u=t[o];if(n.isConnected)try{t[o]=[n,d,l],await c(d,n)}finally{t[o]=u,t.dispatchEvent(i("qsymbol",{symbol:a,element:n}))}}}var w},f=e=>e.hash.replace(/^#?([^?[|]*).*$/,"$1")||"default",d=async e=>{let t=e.target;for(a("-document",e.type,e);t&&t.getAttribute;)await l(t,"",e.type,e),t=e.bubbles&&!0!==e.cancelBubble?t.parentElement:null},u=e=>{a("-window",e.type,e)},b=()=>{const e=t.readyState;if(!n&&("interactive"==e||"complete"==e)){n=1,a("","qinit",i("qinit"));const e=t.querySelectorAll("[on\\\\:qvisible]");if(e.length>0){const t=new IntersectionObserver((e=>{for(const n of e)n.isIntersecting&&(t.unobserve(n.target),l(n.target,"","qvisible",i("qvisible",n)))}));e.forEach((e=>t.observe(e)))}}},v=new Set,p=e=>{for(const t of e)v.has(t)||(document.addEventListener(t,d,{capture:!0}),r.addEventListener(t,u),v.add(t))};if(!t.qR){const e=r.qwikevents;Array.isArray(e)&&p(e),r.qwikevents={push:(...e)=>p(e)},t.addEventListener("readystatechange",b),b()}})(document)})();';
var QWIK_LOADER_OPTIMIZE_DEBUG =
  '(() => {\n    function findModule(module) {\n        return Object.values(module).find(isModule) || module;\n    }\n    function isModule(module) {\n        return "object" == typeof module && module && "Module" === module[Symbol.toStringTag];\n    }\n    ((doc, hasInitialized) => {\n        const win = window;\n        const broadcast = (infix, type, ev) => {\n            type = type.replace(/([A-Z])/g, (a => "-" + a.toLowerCase()));\n            doc.querySelectorAll("[on" + infix + "\\\\:" + type + "]").forEach((target => dispatch(target, infix, type, ev)));\n        };\n        const createEvent = (eventName, detail) => new CustomEvent(eventName, {\n            detail: detail\n        });\n        const error = msg => {\n            throw new Error("QWIK " + msg);\n        };\n        const qrlResolver = (element, qrl) => {\n            element = element.closest("[q\\\\:container]");\n            return new URL(qrl, new URL(element ? element.getAttribute("q:base") : doc.baseURI, doc.baseURI));\n        };\n        const dispatch = async (element, onPrefix, eventName, ev) => {\n            var _a;\n            element.hasAttribute("preventdefault:" + eventName) && ev.preventDefault();\n            const attrName = "on" + onPrefix + ":" + eventName;\n            const qrls = null == (_a = element._qc_) ? void 0 : _a.li[attrName];\n            if (qrls) {\n                for (const q of qrls) {\n                    await q.getFn([ element, ev ], (() => element.isConnected))(ev, element);\n                }\n                return;\n            }\n            const attrValue = element.getAttribute(attrName);\n            if (attrValue) {\n                for (const qrl of attrValue.split("\\n")) {\n                    const url = qrlResolver(element, qrl);\n                    if (url) {\n                        const symbolName = getSymbolName(url);\n                        const handler = (win[url.pathname] || findModule(await import(url.href.split("#")[0])))[symbolName] || error(url + " does not export " + symbolName);\n                        const previousCtx = doc.__q_context__;\n                        if (element.isConnected) {\n                            try {\n                                doc.__q_context__ = [ element, ev, url ];\n                                await handler(ev, element);\n                            } finally {\n                                doc.__q_context__ = previousCtx;\n                                doc.dispatchEvent(createEvent("qsymbol", {\n                                    symbol: symbolName,\n                                    element: element\n                                }));\n                            }\n                        }\n                    }\n                }\n            }\n        };\n        const getSymbolName = url => url.hash.replace(/^#?([^?[|]*).*$/, "$1") || "default";\n        const processDocumentEvent = async ev => {\n            let element = ev.target;\n            broadcast("-document", ev.type, ev);\n            while (element && element.getAttribute) {\n                await dispatch(element, "", ev.type, ev);\n                element = ev.bubbles && !0 !== ev.cancelBubble ? element.parentElement : null;\n            }\n        };\n        const processWindowEvent = ev => {\n            broadcast("-window", ev.type, ev);\n        };\n        const processReadyStateChange = () => {\n            const readyState = doc.readyState;\n            if (!hasInitialized && ("interactive" == readyState || "complete" == readyState)) {\n                hasInitialized = 1;\n                broadcast("", "qinit", createEvent("qinit"));\n                const results = doc.querySelectorAll("[on\\\\:qvisible]");\n                if (results.length > 0) {\n                    const observer = new IntersectionObserver((entries => {\n                        for (const entry of entries) {\n                            if (entry.isIntersecting) {\n                                observer.unobserve(entry.target);\n                                dispatch(entry.target, "", "qvisible", createEvent("qvisible", entry));\n                            }\n                        }\n                    }));\n                    results.forEach((el => observer.observe(el)));\n                }\n            }\n        };\n        const events = new Set;\n        const push = eventNames => {\n            for (const eventName of eventNames) {\n                if (!events.has(eventName)) {\n                    document.addEventListener(eventName, processDocumentEvent, {\n                        capture: !0\n                    });\n                    win.addEventListener(eventName, processWindowEvent);\n                    events.add(eventName);\n                }\n            }\n        };\n        if (!doc.qR) {\n            const qwikevents = win.qwikevents;\n            Array.isArray(qwikevents) && push(qwikevents);\n            win.qwikevents = {\n                push: (...e) => push(e)\n            };\n            doc.addEventListener("readystatechange", processReadyStateChange);\n            processReadyStateChange();\n        }\n    })(document);\n})();';
function getQwikLoaderScript(opts = {}) {
  if (Array.isArray(opts.events) && opts.events.length > 0) {
    const loader = opts.debug
      ? QWIK_LOADER_OPTIMIZE_DEBUG
      : QWIK_LOADER_OPTIMIZE_MINIFIED;
    return loader.replace("window.qEvents", JSON.stringify(opts.events));
  }
  return opts.debug ? QWIK_LOADER_DEFAULT_DEBUG : QWIK_LOADER_DEFAULT_MINIFIED;
}
function getPrefetchResources(snapshotResult, opts, resolvedManifest) {
  if (!resolvedManifest) {
    return [];
  }
  const prefetchStrategy = opts.prefetchStrategy;
  const buildBase = getBuildBase(opts);
  if (prefetchStrategy !== null) {
    if (
      !prefetchStrategy ||
      !prefetchStrategy.symbolsToPrefetch ||
      prefetchStrategy.symbolsToPrefetch === "auto"
    ) {
      return getAutoPrefetch(snapshotResult, resolvedManifest, buildBase);
    }
    if (typeof prefetchStrategy.symbolsToPrefetch === "function") {
      try {
        return prefetchStrategy.symbolsToPrefetch({
          manifest: resolvedManifest.manifest,
        });
      } catch (e) {
        console.error("getPrefetchUrls, symbolsToPrefetch()", e);
      }
    }
  }
  return [];
}
function getAutoPrefetch(snapshotResult, resolvedManifest, buildBase) {
  const prefetchResources = [];
  const listeners = snapshotResult == null ? void 0 : snapshotResult.listeners;
  const stateObjs = snapshotResult == null ? void 0 : snapshotResult.objs;
  const { mapper, manifest: manifest2 } = resolvedManifest;
  const urls = /* @__PURE__ */ new Set();
  if (Array.isArray(listeners)) {
    for (const prioritizedSymbolName in mapper) {
      const hasSymbol = listeners.some((l) => {
        return l.qrl.getHash() === prioritizedSymbolName;
      });
      if (hasSymbol) {
        addBundle(
          manifest2,
          urls,
          prefetchResources,
          buildBase,
          mapper[prioritizedSymbolName][1]
        );
      }
    }
  }
  if (Array.isArray(stateObjs)) {
    for (const obj of stateObjs) {
      if (isQrl(obj)) {
        const qrlSymbolName = obj.getHash();
        const resolvedSymbol = mapper[qrlSymbolName];
        if (resolvedSymbol) {
          addBundle(
            manifest2,
            urls,
            prefetchResources,
            buildBase,
            resolvedSymbol[0]
          );
        }
      }
    }
  }
  return prefetchResources;
}
function addBundle(
  manifest2,
  urls,
  prefetchResources,
  buildBase,
  bundleFileName
) {
  const url = buildBase + bundleFileName;
  if (!urls.has(url)) {
    urls.add(url);
    const bundle = manifest2.bundles[bundleFileName];
    if (bundle) {
      const prefetchResource = {
        url,
        imports: [],
      };
      prefetchResources.push(prefetchResource);
      if (Array.isArray(bundle.imports)) {
        for (const importedFilename of bundle.imports) {
          addBundle(
            manifest2,
            urls,
            prefetchResource.imports,
            buildBase,
            importedFilename
          );
        }
      }
    }
  }
}
var isQrl = (value) => {
  return typeof value === "function" && typeof value.getSymbol === "function";
};
var qDev = globalThis.qDev === true;
var EMPTY_ARRAY = [];
var EMPTY_OBJ = {};
if (qDev) {
  Object.freeze(EMPTY_ARRAY);
  Object.freeze(EMPTY_OBJ);
  Error.stackTraceLimit = 9999;
}
[
  "click",
  "dblclick",
  "contextmenu",
  "auxclick",
  "pointerdown",
  "pointerup",
  "pointermove",
  "pointerover",
  "pointerenter",
  "pointerleave",
  "pointerout",
  "pointercancel",
  "gotpointercapture",
  "lostpointercapture",
  "touchstart",
  "touchend",
  "touchmove",
  "touchcancel",
  "mousedown",
  "mouseup",
  "mousemove",
  "mouseenter",
  "mouseleave",
  "mouseover",
  "mouseout",
  "wheel",
  "gesturestart",
  "gesturechange",
  "gestureend",
  "keydown",
  "keyup",
  "keypress",
  "input",
  "change",
  "search",
  "invalid",
  "beforeinput",
  "select",
  "focusin",
  "focusout",
  "focus",
  "blur",
  "submit",
  "reset",
  "scroll",
].map((n) => `on${n.toLowerCase()}$`);
[
  "useWatch$",
  "useClientEffect$",
  "useEffect$",
  "component$",
  "useStyles$",
  "useStylesScoped$",
].map((n) => n.toLowerCase());
function getValidManifest(manifest2) {
  if (
    manifest2 != null &&
    manifest2.mapping != null &&
    typeof manifest2.mapping === "object" &&
    manifest2.symbols != null &&
    typeof manifest2.symbols === "object" &&
    manifest2.bundles != null &&
    typeof manifest2.bundles === "object"
  ) {
    return manifest2;
  }
  return void 0;
}
function workerFetchScript() {
  const fetch2 = `Promise.all(e.data.map(u=>fetch(u))).finally(()=>{setTimeout(postMessage({}),9999)})`;
  const workerBody = `onmessage=(e)=>{${fetch2}}`;
  const blob = `new Blob(['${workerBody}'],{type:"text/javascript"})`;
  const url = `URL.createObjectURL(${blob})`;
  let s = `const w=new Worker(${url});`;
  s += `w.postMessage(u.map(u=>new URL(u,origin)+''));`;
  s += `w.onmessage=()=>{w.terminate()};`;
  return s;
}
function prefetchUrlsEventScript(prefetchResources) {
  const data = {
    bundles: flattenPrefetchResources(prefetchResources).map((u) =>
      u.split("/").pop()
    ),
  };
  return `dispatchEvent(new CustomEvent("qprefetch",{detail:${JSON.stringify(
    data
  )}}))`;
}
function flattenPrefetchResources(prefetchResources) {
  const urls = [];
  const addPrefetchResource = (prefetchResources2) => {
    if (Array.isArray(prefetchResources2)) {
      for (const prefetchResource of prefetchResources2) {
        if (!urls.includes(prefetchResource.url)) {
          urls.push(prefetchResource.url);
          addPrefetchResource(prefetchResource.imports);
        }
      }
    }
  };
  addPrefetchResource(prefetchResources);
  return urls;
}
function applyPrefetchImplementation(opts, prefetchResources) {
  const { prefetchStrategy } = opts;
  if (prefetchStrategy !== null) {
    const prefetchImpl = normalizePrefetchImplementation(
      prefetchStrategy == null ? void 0 : prefetchStrategy.implementation
    );
    const prefetchNodes = [];
    if (prefetchImpl.prefetchEvent === "always") {
      prefetchUrlsEvent(prefetchNodes, prefetchResources);
    }
    if (prefetchImpl.linkInsert === "html-append") {
      linkHtmlImplementation(prefetchNodes, prefetchResources, prefetchImpl);
    }
    if (prefetchImpl.linkInsert === "js-append") {
      linkJsImplementation(prefetchNodes, prefetchResources, prefetchImpl);
    } else if (prefetchImpl.workerFetchInsert === "always") {
      workerFetchImplementation(prefetchNodes, prefetchResources);
    }
    if (prefetchNodes.length > 0) {
      return jsx(Fragment, { children: prefetchNodes });
    }
  }
  return null;
}
function prefetchUrlsEvent(prefetchNodes, prefetchResources) {
  prefetchNodes.push(
    jsx("script", {
      type: "module",
      dangerouslySetInnerHTML: prefetchUrlsEventScript(prefetchResources),
    })
  );
}
function linkHtmlImplementation(
  prefetchNodes,
  prefetchResources,
  prefetchImpl
) {
  const urls = flattenPrefetchResources(prefetchResources);
  const rel = prefetchImpl.linkRel || "prefetch";
  for (const url of urls) {
    const attributes = {};
    attributes["href"] = url;
    attributes["rel"] = rel;
    if (rel === "prefetch" || rel === "preload") {
      if (url.endsWith(".js")) {
        attributes["as"] = "script";
      }
    }
    prefetchNodes.push(jsx("link", attributes, void 0));
  }
}
function linkJsImplementation(prefetchNodes, prefetchResources, prefetchImpl) {
  const rel = prefetchImpl.linkRel || "prefetch";
  let s = ``;
  if (prefetchImpl.workerFetchInsert === "no-link-support") {
    s += `let supportsLinkRel = true;`;
  }
  s += `const u=${JSON.stringify(
    flattenPrefetchResources(prefetchResources)
  )};`;
  s += `u.map((u,i)=>{`;
  s += `const l=document.createElement('link');`;
  s += `l.setAttribute("href",u);`;
  s += `l.setAttribute("rel","${rel}");`;
  if (prefetchImpl.workerFetchInsert === "no-link-support") {
    s += `if(i===0){`;
    s += `try{`;
    s += `supportsLinkRel=l.relList.supports("${rel}");`;
    s += `}catch(e){}`;
    s += `}`;
  }
  s += `document.body.appendChild(l);`;
  s += `});`;
  if (prefetchImpl.workerFetchInsert === "no-link-support") {
    s += `if(!supportsLinkRel){`;
    s += workerFetchScript();
    s += `}`;
  }
  if (prefetchImpl.workerFetchInsert === "always") {
    s += workerFetchScript();
  }
  prefetchNodes.push(
    jsx("script", {
      type: "module",
      dangerouslySetInnerHTML: s,
    })
  );
}
function workerFetchImplementation(prefetchNodes, prefetchResources) {
  let s = `const u=${JSON.stringify(
    flattenPrefetchResources(prefetchResources)
  )};`;
  s += workerFetchScript();
  prefetchNodes.push(
    jsx("script", {
      type: "module",
      dangerouslySetInnerHTML: s,
    })
  );
}
function normalizePrefetchImplementation(input) {
  if (typeof input === "string") {
    switch (input) {
      case "link-prefetch-html": {
        return {
          linkInsert: "html-append",
          linkRel: "prefetch",
          workerFetchInsert: null,
          prefetchEvent: null,
        };
      }
      case "link-prefetch": {
        return {
          linkInsert: "js-append",
          linkRel: "prefetch",
          workerFetchInsert: "no-link-support",
          prefetchEvent: null,
        };
      }
      case "link-preload-html": {
        return {
          linkInsert: "html-append",
          linkRel: "preload",
          workerFetchInsert: null,
          prefetchEvent: null,
        };
      }
      case "link-preload": {
        return {
          linkInsert: "js-append",
          linkRel: "preload",
          workerFetchInsert: "no-link-support",
          prefetchEvent: null,
        };
      }
      case "link-modulepreload-html": {
        return {
          linkInsert: "html-append",
          linkRel: "modulepreload",
          workerFetchInsert: null,
          prefetchEvent: null,
        };
      }
      case "link-modulepreload": {
        return {
          linkInsert: "js-append",
          linkRel: "modulepreload",
          workerFetchInsert: "no-link-support",
          prefetchEvent: null,
        };
      }
    }
    return {
      linkInsert: null,
      linkRel: null,
      workerFetchInsert: "always",
      prefetchEvent: null,
    };
  }
  if (input && typeof input === "object") {
    return input;
  }
  const defaultImplementation = {
    linkInsert: null,
    linkRel: null,
    workerFetchInsert: "always",
    prefetchEvent: null,
  };
  return defaultImplementation;
}
var DOCTYPE = "<!DOCTYPE html>";
async function renderToStream(rootNode, opts) {
  var _a2, _b, _c, _d, _e, _f;
  let stream = opts.stream;
  let bufferSize = 0;
  let totalSize = 0;
  let networkFlushes = 0;
  let firstFlushTime = 0;
  const inOrderStreaming =
    (_b = (_a2 = opts.streaming) == null ? void 0 : _a2.inOrder) != null
      ? _b
      : {
          strategy: "auto",
          maximunInitialChunk: 5e4,
          maximunChunk: 3e4,
        };
  const containerTagName = (_c = opts.containerTagName) != null ? _c : "html";
  const containerAttributes = (_d = opts.containerAttributes) != null ? _d : {};
  let buffer = "";
  const nativeStream = stream;
  const firstFlushTimer = createTimer();
  function flush() {
    if (buffer) {
      nativeStream.write(buffer);
      buffer = "";
      bufferSize = 0;
      networkFlushes++;
      if (networkFlushes === 1) {
        firstFlushTime = firstFlushTimer();
      }
    }
  }
  function enqueue(chunk) {
    bufferSize += chunk.length;
    totalSize += chunk.length;
    buffer += chunk;
  }
  switch (inOrderStreaming.strategy) {
    case "disabled":
      stream = {
        write: enqueue,
      };
      break;
    case "direct":
      stream = nativeStream;
      break;
    case "auto":
      let count = 0;
      let forceFlush = false;
      const minimunChunkSize =
        (_e = inOrderStreaming.maximunChunk) != null ? _e : 0;
      const initialChunkSize =
        (_f = inOrderStreaming.maximunInitialChunk) != null ? _f : 0;
      stream = {
        write(chunk) {
          if (chunk === "<!--qkssr-f-->") {
            forceFlush || (forceFlush = true);
          } else if (chunk === "<!--qkssr-pu-->") {
            count++;
          } else if (chunk === "<!--qkssr-po-->") {
            count--;
          } else {
            enqueue(chunk);
          }
          const chunkSize =
            networkFlushes === 0 ? initialChunkSize : minimunChunkSize;
          if (count === 0 && (forceFlush || bufferSize >= chunkSize)) {
            forceFlush = false;
            flush();
          }
        },
      };
      break;
  }
  if (containerTagName === "html") {
    stream.write(DOCTYPE);
  } else {
    if (opts.qwikLoader) {
      if (opts.qwikLoader.include === void 0) {
        opts.qwikLoader.include = "never";
      }
      if (opts.qwikLoader.position === void 0) {
        opts.qwikLoader.position = "bottom";
      }
    } else {
      opts.qwikLoader = {
        include: "never",
      };
    }
  }
  if (!opts.manifest) {
    console.warn(
      "Missing client manifest, loading symbols in the client might 404"
    );
  }
  const buildBase = getBuildBase(opts);
  const resolvedManifest = resolveManifest(opts.manifest);
  await setServerPlatform(opts, resolvedManifest);
  let prefetchResources = [];
  let snapshotResult = null;
  const injections =
    resolvedManifest == null ? void 0 : resolvedManifest.manifest.injections;
  const beforeContent = injections
    ? injections.map((injection) => {
        var _a3;
        return jsx(
          injection.tag,
          (_a3 = injection.attributes) != null ? _a3 : EMPTY_OBJ
        );
      })
    : void 0;
  const renderTimer = createTimer();
  const renderSymbols = [];
  let renderTime = 0;
  let snapshotTime = 0;
  await renderSSR(rootNode, {
    stream,
    containerTagName,
    containerAttributes,
    envData: opts.envData,
    base: buildBase,
    beforeContent,
    beforeClose: async (contexts, containerState) => {
      var _a3, _b2, _c2;
      renderTime = renderTimer();
      const snapshotTimer = createTimer();
      snapshotResult = await _pauseFromContexts(contexts, containerState);
      prefetchResources = getPrefetchResources(
        snapshotResult,
        opts,
        resolvedManifest
      );
      const jsonData = JSON.stringify(
        snapshotResult.state,
        void 0,
        qDev ? "  " : void 0
      );
      const children = [
        jsx("script", {
          type: "qwik/json",
          dangerouslySetInnerHTML: escapeText(jsonData),
        }),
      ];
      if (prefetchResources.length > 0) {
        children.push(applyPrefetchImplementation(opts, prefetchResources));
      }
      const needLoader = !snapshotResult || snapshotResult.mode !== "static";
      const includeMode =
        (_b2 = (_a3 = opts.qwikLoader) == null ? void 0 : _a3.include) != null
          ? _b2
          : "auto";
      const includeLoader =
        includeMode === "always" || (includeMode === "auto" && needLoader);
      if (includeLoader) {
        const qwikLoaderScript = getQwikLoaderScript({
          events: (_c2 = opts.qwikLoader) == null ? void 0 : _c2.events,
          debug: opts.debug,
        });
        children.push(
          jsx("script", {
            id: "qwikloader",
            dangerouslySetInnerHTML: qwikLoaderScript,
          })
        );
      }
      const uniqueListeners = /* @__PURE__ */ new Set();
      snapshotResult.listeners.forEach((li) => {
        uniqueListeners.add(JSON.stringify(li.eventName));
      });
      const extraListeners = Array.from(uniqueListeners);
      if (extraListeners.length > 0) {
        let content = `window.qwikevents.push(${extraListeners.join(", ")})`;
        if (!includeLoader) {
          content = `window.qwikevents||=[];${content}`;
        }
        children.push(
          jsx("script", {
            dangerouslySetInnerHTML: content,
          })
        );
      }
      collectRenderSymbols(renderSymbols, contexts);
      snapshotTime = snapshotTimer();
      return jsx(Fragment, { children });
    },
  });
  flush();
  const result = {
    prefetchResources: void 0,
    snapshotResult,
    flushes: networkFlushes,
    manifest: resolvedManifest == null ? void 0 : resolvedManifest.manifest,
    size: totalSize,
    timing: {
      render: renderTime,
      snapshot: snapshotTime,
      firstFlush: firstFlushTime,
    },
    _symbols: renderSymbols,
  };
  return result;
}
function resolveManifest(manifest2) {
  if (!manifest2) {
    return void 0;
  }
  if ("mapper" in manifest2) {
    return manifest2;
  }
  manifest2 = getValidManifest(manifest2);
  if (manifest2) {
    const mapper = {};
    Object.entries(manifest2.mapping).forEach(([key, value]) => {
      mapper[getSymbolHash(key)] = [key, value];
    });
    return {
      mapper,
      manifest: manifest2,
    };
  }
  return void 0;
}
var escapeText = (str) => {
  return str.replace(/<(\/?script)/g, "\\x3C$1");
};
function collectRenderSymbols(renderSymbols, elements) {
  var _a2;
  for (const ctx of elements) {
    const symbol = (_a2 = ctx.$renderQrl$) == null ? void 0 : _a2.getSymbol();
    if (symbol && !renderSymbols.includes(symbol)) {
      renderSymbols.push(symbol);
    }
  }
}
const manifest = {
  symbols: {
    s_hA9UPaY8sNQ: {
      origin: "../node_modules/@builder.io/qwik-city/index.qwik.mjs",
      displayName: "Link_component_a_onClick",
      canonicalFilename: "s_ha9upay8snq",
      hash: "hA9UPaY8sNQ",
      ctxKind: "event",
      ctxName: "onClick$",
      captures: true,
      parent: "s_mYsiJcA4IBc",
    },
    s_skxgNVWVOT8: {
      origin: "../node_modules/@builder.io/qwik-city/index.qwik.mjs",
      displayName: "Link_component_a_onMouseOver",
      canonicalFilename: "s_skxgnvwvot8",
      hash: "skxgNVWVOT8",
      ctxKind: "event",
      ctxName: "onMouseOver$",
      captures: false,
      parent: "s_mYsiJcA4IBc",
    },
    s_uVE5iM9H73c: {
      origin: "../node_modules/@builder.io/qwik-city/index.qwik.mjs",
      displayName: "Link_component_a_onQVisible",
      canonicalFilename: "s_uve5im9h73c",
      hash: "uVE5iM9H73c",
      ctxKind: "event",
      ctxName: "onQVisible$",
      captures: false,
      parent: "s_mYsiJcA4IBc",
    },
    s_AaAlzKH0KlQ: {
      origin: "../node_modules/@builder.io/qwik-city/index.qwik.mjs",
      displayName: "QwikCity_component_useWatch",
      canonicalFilename: "s_aaalzkh0klq",
      hash: "AaAlzKH0KlQ",
      ctxKind: "function",
      ctxName: "useWatch$",
      captures: true,
      parent: "s_z1nvHyEppoI",
    },
    s_2ivu5Sivbf0: {
      origin: "components/card/profile-card.tsx",
      displayName: "ProfileCard_component",
      canonicalFilename: "s_2ivu5sivbf0",
      hash: "2ivu5Sivbf0",
      ctxKind: "function",
      ctxName: "component$",
      captures: false,
    },
    s_3sccYCDd1Z0: {
      origin: "root.tsx",
      displayName: "root_component",
      canonicalFilename: "s_3sccycdd1z0",
      hash: "3sccYCDd1Z0",
      ctxKind: "function",
      ctxName: "component$",
      captures: false,
    },
    s_ACA0Fav3IHM: {
      origin: "components/marquee/second-marquee.tsx",
      displayName: "SecondMarquee_component",
      canonicalFilename: "s_aca0fav3ihm",
      hash: "ACA0Fav3IHM",
      ctxKind: "function",
      ctxName: "component$",
      captures: false,
    },
    s_VkLNXphUh5s: {
      origin: "routes/layout.tsx",
      displayName: "layout_component",
      canonicalFilename: "s_vklnxphuh5s",
      hash: "VkLNXphUh5s",
      ctxKind: "function",
      ctxName: "component$",
      captures: false,
    },
    s_WecD0DfE8gs: {
      origin: "components/marquee/first-marquee.tsx",
      displayName: "FirstMarquee_component",
      canonicalFilename: "s_wecd0dfe8gs",
      hash: "WecD0DfE8gs",
      ctxKind: "function",
      ctxName: "component$",
      captures: false,
    },
    s_ceU05TscGYE: {
      origin: "components/header/header.tsx",
      displayName: "header_component",
      canonicalFilename: "s_ceu05tscgye",
      hash: "ceU05TscGYE",
      ctxKind: "function",
      ctxName: "component$",
      captures: false,
    },
    s_mYsiJcA4IBc: {
      origin: "../node_modules/@builder.io/qwik-city/index.qwik.mjs",
      displayName: "Link_component",
      canonicalFilename: "s_mysijca4ibc",
      hash: "mYsiJcA4IBc",
      ctxKind: "function",
      ctxName: "component$",
      captures: false,
    },
    s_nd8yk3KO22c: {
      origin: "../node_modules/@builder.io/qwik-city/index.qwik.mjs",
      displayName: "RouterOutlet_component",
      canonicalFilename: "s_nd8yk3ko22c",
      hash: "nd8yk3KO22c",
      ctxKind: "function",
      ctxName: "component$",
      captures: false,
    },
    s_v0Tdhkf3cbY: {
      origin: "components/section/hero.tsx",
      displayName: "Hero_component",
      canonicalFilename: "s_v0tdhkf3cby",
      hash: "v0Tdhkf3cbY",
      ctxKind: "function",
      ctxName: "component$",
      captures: false,
    },
    s_xYL1qOwPyDI: {
      origin: "routes/index.tsx",
      displayName: "routes_component",
      canonicalFilename: "s_xyl1qowpydi",
      hash: "xYL1qOwPyDI",
      ctxKind: "function",
      ctxName: "component$",
      captures: false,
    },
    s_z1nvHyEppoI: {
      origin: "../node_modules/@builder.io/qwik-city/index.qwik.mjs",
      displayName: "QwikCity_component",
      canonicalFilename: "s_z1nvhyeppoi",
      hash: "z1nvHyEppoI",
      ctxKind: "function",
      ctxName: "component$",
      captures: false,
    },
    s_zrbrqoaqXSY: {
      origin: "components/router-head/router-head.tsx",
      displayName: "RouterHead_component",
      canonicalFilename: "s_zrbrqoaqxsy",
      hash: "zrbrqoaqXSY",
      ctxKind: "function",
      ctxName: "component$",
      captures: false,
    },
    s_U36di84Xmj0: {
      origin: "components/header/header.tsx",
      displayName: "header_component_toggleMenu",
      canonicalFilename: "s_u36di84xmj0",
      hash: "U36di84Xmj0",
      ctxKind: "function",
      ctxName: "$",
      captures: false,
      parent: "s_ceU05TscGYE",
    },
  },
  mapping: {
    s_hA9UPaY8sNQ: "q-6bea4344.js",
    s_skxgNVWVOT8: "q-6bea4344.js",
    s_uVE5iM9H73c: "q-6bea4344.js",
    s_AaAlzKH0KlQ: "q-e187b2d4.js",
    s_2ivu5Sivbf0: "q-2bae52ce.js",
    s_3sccYCDd1Z0: "q-6abe325b.js",
    s_ACA0Fav3IHM: "q-9f09f338.js",
    s_VkLNXphUh5s: "q-675622fe.js",
    s_WecD0DfE8gs: "q-fbde958b.js",
    s_ceU05TscGYE: "q-183506da.js",
    s_mYsiJcA4IBc: "q-6bea4344.js",
    s_nd8yk3KO22c: "q-bd767572.js",
    s_v0Tdhkf3cbY: "q-f85d3f7b.js",
    s_xYL1qOwPyDI: "q-8e50968d.js",
    s_z1nvHyEppoI: "q-e187b2d4.js",
    s_zrbrqoaqXSY: "q-c07f979e.js",
    s_U36di84Xmj0: "q-183506da.js",
  },
  bundles: {
    "q-143c7194.js": {
      size: 2180,
      origins: [
        "node_modules/@builder.io/qwik-city/service-worker.mjs",
        "src/routes/service-worker.js",
      ],
    },
    "q-183506da.js": {
      size: 1180,
      imports: ["q-aaa47f05.js"],
      origins: [
        "src/components/icons/menu.js",
        "src/entry_header.js",
        "src/s_ceu05tscgye.js",
        "src/s_u36di84xmj0.js",
      ],
      symbols: ["s_ceU05TscGYE", "s_U36di84Xmj0"],
    },
    "q-2bae52ce.js": {
      size: 3214,
      imports: ["q-aaa47f05.js"],
      origins: [
        "src/components/icons/github.js",
        "src/components/icons/instagram.js",
        "src/components/icons/linkedin.js",
        "src/entry_ProfileCard.js",
        "src/s_2ivu5sivbf0.js",
      ],
      symbols: ["s_2ivu5Sivbf0"],
    },
    "q-675622fe.js": {
      size: 351,
      imports: ["q-aaa47f05.js"],
      dynamicImports: ["q-183506da.js"],
      origins: [
        "src/components/header/header.js",
        "src/entry_layout.js",
        "src/s_vklnxphuh5s.js",
      ],
      symbols: ["s_VkLNXphUh5s"],
    },
    "q-6916d310.js": {
      size: 205,
      imports: ["q-aaa47f05.js"],
      dynamicImports: ["q-8e50968d.js"],
      origins: ["src/routes/index.js"],
    },
    "q-6abe325b.js": {
      size: 4578,
      imports: ["q-aaa47f05.js"],
      dynamicImports: [
        "q-6bea4344.js",
        "q-8bf5c2c9.js",
        "q-bd767572.js",
        "q-c07f979e.js",
        "q-e187b2d4.js",
      ],
      origins: [
        "node_modules/@builder.io/qwik-city/index.qwik.mjs",
        "src/components/router-head/router-head.js",
        "src/entry_root.js",
        "src/s_3sccycdd1z0.js",
      ],
      symbols: ["s_3sccYCDd1Z0"],
    },
    "q-6bea4344.js": {
      size: 886,
      imports: ["q-6abe325b.js", "q-aaa47f05.js"],
      origins: [
        "src/entry_Link.js",
        "src/s_ha9upay8snq.js",
        "src/s_mysijca4ibc.js",
        "src/s_skxgnvwvot8.js",
        "src/s_uve5im9h73c.js",
      ],
      symbols: [
        "s_hA9UPaY8sNQ",
        "s_mYsiJcA4IBc",
        "s_skxgNVWVOT8",
        "s_uVE5iM9H73c",
      ],
    },
    "q-8bf5c2c9.js": {
      size: 346,
      imports: ["q-aaa47f05.js"],
      dynamicImports: ["q-6916d310.js", "q-959a2884.js", "q-fdf75541.js"],
      origins: ["@qwik-city-plan"],
    },
    "q-8e50968d.js": {
      size: 722,
      imports: ["q-aaa47f05.js"],
      dynamicImports: [
        "q-2bae52ce.js",
        "q-9f09f338.js",
        "q-f85d3f7b.js",
        "q-fbde958b.js",
      ],
      origins: [
        "src/components/card/profile-card.js",
        "src/components/marquee/first-marquee.js",
        "src/components/marquee/second-marquee.js",
        "src/components/section/hero.js",
        "src/entry_routes.js",
        "src/s_xyl1qowpydi.js",
      ],
      symbols: ["s_xYL1qOwPyDI"],
    },
    "q-959a2884.js": {
      size: 158,
      imports: ["q-aaa47f05.js"],
      dynamicImports: ["q-675622fe.js"],
      origins: ["src/routes/layout.js"],
    },
    "q-9f09f338.js": {
      size: 969,
      imports: ["q-aaa47f05.js"],
      origins: ["src/entry_SecondMarquee.js", "src/s_aca0fav3ihm.js"],
      symbols: ["s_ACA0Fav3IHM"],
    },
    "q-aaa47f05.js": {
      size: 33229,
      dynamicImports: ["q-6abe325b.js"],
      origins: [
        "\0vite/preload-helper",
        "node_modules/@builder.io/qwik/core.min.mjs",
        "src/global.css",
        "src/root.js",
      ],
    },
    "q-bc0d0f7e.js": { size: 58, imports: ["q-aaa47f05.js"] },
    "q-bd767572.js": {
      size: 269,
      imports: ["q-6abe325b.js", "q-aaa47f05.js"],
      origins: ["src/entry_RouterOutlet.js", "src/s_nd8yk3ko22c.js"],
      symbols: ["s_nd8yk3KO22c"],
    },
    "q-c07f979e.js": {
      size: 1061,
      imports: ["q-6abe325b.js", "q-aaa47f05.js"],
      origins: ["src/entry_RouterHead.js", "src/s_zrbrqoaqxsy.js"],
      symbols: ["s_zrbrqoaqXSY"],
    },
    "q-e187b2d4.js": {
      size: 1489,
      imports: ["q-6abe325b.js", "q-aaa47f05.js"],
      dynamicImports: ["q-8bf5c2c9.js"],
      origins: [
        "@builder.io/qwik/build",
        "src/entry_QwikCity.js",
        "src/s_aaalzkh0klq.js",
        "src/s_z1nvhyeppoi.js",
      ],
      symbols: ["s_AaAlzKH0KlQ", "s_z1nvHyEppoI"],
    },
    "q-f85d3f7b.js": {
      size: 693,
      imports: ["q-aaa47f05.js"],
      origins: ["src/entry_Hero.js", "src/s_v0tdhkf3cby.js"],
      symbols: ["s_v0Tdhkf3cbY"],
    },
    "q-fbde958b.js": {
      size: 1594,
      imports: ["q-aaa47f05.js"],
      origins: ["src/entry_FirstMarquee.js", "src/s_wecd0dfe8gs.js"],
      symbols: ["s_WecD0DfE8gs"],
    },
    "q-fdf75541.js": {
      size: 128,
      imports: ["q-aaa47f05.js"],
      dynamicImports: ["q-143c7194.js"],
      origins: ["@qwik-city-entries"],
    },
  },
  injections: [
    {
      tag: "link",
      location: "head",
      attributes: { rel: "stylesheet", href: "/build/q-04ee7376.css" },
    },
  ],
  version: "1",
  options: {
    target: "client",
    buildMode: "production",
    forceFullBuild: true,
    entryStrategy: { type: "smart" },
  },
  platform: {
    qwik: "0.9.0",
    vite: "",
    rollup: "2.78.1",
    env: "node",
    os: "linux",
    node: "16.17.1",
  },
};
const isServer = true;
const isBrowser = false;
const ContentContext = /* @__PURE__ */ createContext$1("qc-c");
const ContentInternalContext = /* @__PURE__ */ createContext$1("qc-ic");
const DocumentHeadContext = /* @__PURE__ */ createContext$1("qc-h");
const RouteLocationContext = /* @__PURE__ */ createContext$1("qc-l");
const RouteNavigateContext = /* @__PURE__ */ createContext$1("qc-n");
const RouterOutlet = /* @__PURE__ */ componentQrl(
  inlinedQrl(() => {
    const { contents } = useContext(ContentInternalContext);
    if (contents && contents.length > 0) {
      const contentsLen = contents.length;
      let cmp = null;
      for (let i = contentsLen - 1; i >= 0; i--)
        cmp = jsx(contents[i].default, {
          children: cmp,
        });
      return cmp;
    }
    return SkipRender;
  }, "RouterOutlet_component_nd8yk3KO22c")
);
const MODULE_CACHE = /* @__PURE__ */ new WeakMap();
const loadRoute = async (routes2, menus2, cacheModules2, pathname) => {
  if (Array.isArray(routes2))
    for (const route of routes2) {
      const match = route[0].exec(pathname);
      if (match) {
        const loaders = route[1];
        const params = getRouteParams(route[2], match);
        const routeBundleNames = route[4];
        const mods = new Array(loaders.length);
        const pendingLoads = [];
        const menuLoader = getMenuLoader(menus2, pathname);
        let menu = void 0;
        loaders.forEach((moduleLoader, i) => {
          loadModule(
            moduleLoader,
            pendingLoads,
            (routeModule) => (mods[i] = routeModule),
            cacheModules2
          );
        });
        loadModule(
          menuLoader,
          pendingLoads,
          (menuModule) =>
            (menu = menuModule == null ? void 0 : menuModule.default),
          cacheModules2
        );
        if (pendingLoads.length > 0) await Promise.all(pendingLoads);
        return [params, mods, menu, routeBundleNames];
      }
    }
  return null;
};
const loadModule = (
  moduleLoader,
  pendingLoads,
  moduleSetter,
  cacheModules2
) => {
  if (typeof moduleLoader === "function") {
    const loadedModule = MODULE_CACHE.get(moduleLoader);
    if (loadedModule) moduleSetter(loadedModule);
    else {
      const l = moduleLoader();
      if (typeof l.then === "function")
        pendingLoads.push(
          l.then((loadedModule2) => {
            if (cacheModules2 !== false)
              MODULE_CACHE.set(moduleLoader, loadedModule2);
            moduleSetter(loadedModule2);
          })
        );
      else if (l) moduleSetter(l);
    }
  }
};
const getMenuLoader = (menus2, pathname) => {
  if (menus2) {
    const menu = menus2.find(
      (m) =>
        m[0] === pathname ||
        pathname.startsWith(m[0] + (pathname.endsWith("/") ? "" : "/"))
    );
    if (menu) return menu[1];
  }
  return void 0;
};
const getRouteParams = (paramNames, match) => {
  const params = {};
  if (paramNames)
    for (let i = 0; i < paramNames.length; i++)
      params[paramNames[i]] = match ? match[i + 1] : "";
  return params;
};
const resolveHead = (endpoint, routeLocation, contentModules) => {
  const head2 = createDocumentHead();
  const headProps = {
    data: endpoint ? endpoint.body : null,
    head: head2,
    ...routeLocation,
  };
  for (let i = contentModules.length - 1; i >= 0; i--) {
    const contentModuleHead = contentModules[i] && contentModules[i].head;
    if (contentModuleHead) {
      if (typeof contentModuleHead === "function")
        resolveDocumentHead(head2, contentModuleHead(headProps));
      else if (typeof contentModuleHead === "object")
        resolveDocumentHead(head2, contentModuleHead);
    }
  }
  return headProps.head;
};
const resolveDocumentHead = (resolvedHead, updatedHead) => {
  if (typeof updatedHead.title === "string")
    resolvedHead.title = updatedHead.title;
  mergeArray(resolvedHead.meta, updatedHead.meta);
  mergeArray(resolvedHead.links, updatedHead.links);
  mergeArray(resolvedHead.styles, updatedHead.styles);
};
const mergeArray = (existingArr, newArr) => {
  if (Array.isArray(newArr))
    for (const newItem of newArr) {
      if (typeof newItem.key === "string") {
        const existingIndex = existingArr.findIndex(
          (i) => i.key === newItem.key
        );
        if (existingIndex > -1) {
          existingArr[existingIndex] = newItem;
          continue;
        }
      }
      existingArr.push(newItem);
    }
};
const createDocumentHead = () => ({
  title: "",
  meta: [],
  links: [],
  styles: [],
});
const useDocumentHead = () => useContext(DocumentHeadContext);
const useLocation = () => useContext(RouteLocationContext);
const useNavigate = () => useContext(RouteNavigateContext);
const useQwikCityEnv = () => noSerialize(useEnvData("qwikcity"));
const toPath = (url) => url.pathname + url.search + url.hash;
const toUrl = (url, baseUrl) => new URL(url, baseUrl.href);
const isSameOrigin = (a, b) => a.origin === b.origin;
const isSamePath = (a, b) => a.pathname + a.search === b.pathname + b.search;
const isSamePathname = (a, b) => a.pathname === b.pathname;
const isSameOriginDifferentPathname = (a, b) =>
  isSameOrigin(a, b) && !isSamePath(a, b);
const getClientEndpointPath = (pathname) =>
  pathname + (pathname.endsWith("/") ? "" : "/") + "q-data.json";
const getClientNavPath = (props, baseUrl) => {
  const href = props.href;
  if (
    typeof href === "string" &&
    href.trim() !== "" &&
    typeof props.target !== "string"
  )
    try {
      const linkUrl = toUrl(href, baseUrl);
      const currentUrl = toUrl("", baseUrl);
      if (isSameOrigin(linkUrl, currentUrl)) return toPath(linkUrl);
    } catch (e) {
      console.error(e);
    }
  return null;
};
const getPrefetchUrl = (props, clientNavPath, currentLoc) => {
  if (props.prefetch && clientNavPath) {
    const prefetchUrl = toUrl(clientNavPath, currentLoc);
    if (!isSamePathname(prefetchUrl, toUrl("", currentLoc)))
      return prefetchUrl + "";
  }
  return null;
};
const clientNavigate = (win, routeNavigate) => {
  const currentUrl = win.location;
  const newUrl = toUrl(routeNavigate.path, currentUrl);
  if (isSameOriginDifferentPathname(currentUrl, newUrl)) {
    handleScroll(win, currentUrl, newUrl);
    win.history.pushState("", "", toPath(newUrl));
  }
  if (!win[CLIENT_HISTORY_INITIALIZED]) {
    win[CLIENT_HISTORY_INITIALIZED] = 1;
    win.addEventListener("popstate", () => {
      const currentUrl2 = win.location;
      const previousUrl = toUrl(routeNavigate.path, currentUrl2);
      if (isSameOriginDifferentPathname(currentUrl2, previousUrl)) {
        handleScroll(win, previousUrl, currentUrl2);
        routeNavigate.path = toPath(currentUrl2);
      }
    });
  }
};
const handleScroll = async (win, previousUrl, newUrl) => {
  const doc = win.document;
  const newHash = newUrl.hash;
  if (isSamePath(previousUrl, newUrl)) {
    if (previousUrl.hash !== newHash) {
      await domWait();
      if (newHash) scrollToHashId(doc, newHash);
      else win.scrollTo(0, 0);
    }
  } else {
    if (newHash)
      for (let i = 0; i < 24; i++) {
        await domWait();
        if (scrollToHashId(doc, newHash)) break;
      }
    else {
      await domWait();
      win.scrollTo(0, 0);
    }
  }
};
const domWait = () => new Promise((resolve) => setTimeout(resolve, 12));
const scrollToHashId = (doc, hash) => {
  const elmId = hash.slice(1);
  const elm = doc.getElementById(elmId);
  if (elm) elm.scrollIntoView();
  return elm;
};
const dispatchPrefetchEvent = (prefetchData) =>
  dispatchEvent(
    new CustomEvent("qprefetch", {
      detail: prefetchData,
    })
  );
const CLIENT_HISTORY_INITIALIZED = /* @__PURE__ */ Symbol();
const loadClientData = async (href) => {
  const { cacheModules: cacheModules2 } = await Promise.resolve().then(
    () => _qwikCityPlan
  );
  const pagePathname = new URL(href).pathname;
  const endpointUrl = getClientEndpointPath(pagePathname);
  const now = Date.now();
  const expiration = cacheModules2 ? 6e5 : 15e3;
  const cachedClientPageIndex = cachedClientPages.findIndex(
    (c) => c.u === endpointUrl
  );
  let cachedClientPageData = cachedClientPages[cachedClientPageIndex];
  dispatchPrefetchEvent({
    links: [pagePathname],
  });
  if (!cachedClientPageData || cachedClientPageData.t + expiration < now) {
    cachedClientPageData = {
      u: endpointUrl,
      t: now,
      c: new Promise((resolve) => {
        fetch(endpointUrl).then(
          (clientResponse) => {
            const contentType =
              clientResponse.headers.get("content-type") || "";
            if (clientResponse.ok && contentType.includes("json"))
              clientResponse.json().then(
                (clientData) => {
                  dispatchPrefetchEvent({
                    bundles: clientData.prefetch,
                    links: [pagePathname],
                  });
                  resolve(clientData);
                },
                () => resolve(null)
              );
            else resolve(null);
          },
          () => resolve(null)
        );
      }),
    };
    for (let i = cachedClientPages.length - 1; i >= 0; i--)
      if (cachedClientPages[i].t + expiration < now)
        cachedClientPages.splice(i, 1);
    cachedClientPages.push(cachedClientPageData);
  }
  cachedClientPageData.c.catch((e) => console.error(e));
  return cachedClientPageData.c;
};
const cachedClientPages = [];
const QwikCity = /* @__PURE__ */ componentQrl(
  inlinedQrl(() => {
    const env = useQwikCityEnv();
    if (!(env == null ? void 0 : env.params))
      throw new Error(`Missing Qwik City Env Data`);
    const urlEnv = useEnvData("url");
    if (!urlEnv) throw new Error(`Missing Qwik URL Env Data`);
    const url = new URL(urlEnv);
    const routeLocation = useStore({
      href: url.href,
      pathname: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      params: env.params,
    });
    const routeNavigate = useStore({
      path: toPath(url),
    });
    const documentHead = useStore(createDocumentHead);
    const content = useStore({
      headings: void 0,
      menu: void 0,
    });
    const contentInternal = useStore({
      contents: void 0,
    });
    useContextProvider(ContentContext, content);
    useContextProvider(ContentInternalContext, contentInternal);
    useContextProvider(DocumentHeadContext, documentHead);
    useContextProvider(RouteLocationContext, routeLocation);
    useContextProvider(RouteNavigateContext, routeNavigate);
    useWatchQrl(
      inlinedQrl(
        async ({ track }) => {
          const [
            content2,
            contentInternal2,
            documentHead2,
            env2,
            routeLocation2,
            routeNavigate2,
          ] = useLexicalScope();
          const {
            routes: routes2,
            menus: menus2,
            cacheModules: cacheModules2,
          } = await Promise.resolve().then(() => _qwikCityPlan);
          const path = track(routeNavigate2, "path");
          const url2 = new URL(path, routeLocation2.href);
          const pathname = url2.pathname;
          const loadRoutePromise = loadRoute(
            routes2,
            menus2,
            cacheModules2,
            pathname
          );
          const endpointResponse = isServer
            ? env2.response
            : loadClientData(url2.href);
          const loadedRoute = await loadRoutePromise;
          if (loadedRoute) {
            const [params, mods, menu] = loadedRoute;
            const contentModules = mods;
            const pageModule = contentModules[contentModules.length - 1];
            routeLocation2.href = url2.href;
            routeLocation2.pathname = pathname;
            routeLocation2.params = {
              ...params,
            };
            routeLocation2.query = Object.fromEntries(
              url2.searchParams.entries()
            );
            content2.headings = pageModule.headings;
            content2.menu = menu;
            contentInternal2.contents = noSerialize(contentModules);
            const clientPageData = await endpointResponse;
            const resolvedHead = resolveHead(
              clientPageData,
              routeLocation2,
              contentModules
            );
            documentHead2.links = resolvedHead.links;
            documentHead2.meta = resolvedHead.meta;
            documentHead2.styles = resolvedHead.styles;
            documentHead2.title = resolvedHead.title;
            if (isBrowser) clientNavigate(window, routeNavigate2);
          }
        },
        "QwikCity_component_useWatch_AaAlzKH0KlQ",
        [
          content,
          contentInternal,
          documentHead,
          env,
          routeLocation,
          routeNavigate,
        ]
      )
    );
    return /* @__PURE__ */ jsx(Slot, {});
  }, "QwikCity_component_z1nvHyEppoI")
);
/* @__PURE__ */ componentQrl(
  inlinedQrl((props) => {
    const nav = useNavigate();
    const loc = useLocation();
    const originalHref = props.href;
    const linkProps = {
      ...props,
    };
    const clientNavPath = getClientNavPath(linkProps, loc);
    const prefetchUrl = getPrefetchUrl(props, clientNavPath, loc);
    linkProps["preventdefault:click"] = !!clientNavPath;
    linkProps.href = clientNavPath || originalHref;
    return /* @__PURE__ */ jsx("a", {
      ...linkProps,
      onClick$: inlinedQrl(
        () => {
          const [clientNavPath2, linkProps2, nav2] = useLexicalScope();
          if (clientNavPath2) nav2.path = linkProps2.href;
        },
        "Link_component_a_onClick_hA9UPaY8sNQ",
        [clientNavPath, linkProps, nav]
      ),
      "data-prefetch": prefetchUrl,
      onMouseOver$: inlinedQrl(
        (_, elm) => prefetchLinkResources(elm),
        "Link_component_a_onMouseOver_skxgNVWVOT8"
      ),
      onQVisible$: inlinedQrl(
        (_, elm) => prefetchLinkResources(elm, true),
        "Link_component_a_onQVisible_uVE5iM9H73c"
      ),
      children: /* @__PURE__ */ jsx(Slot, {}),
    });
  }, "Link_component_mYsiJcA4IBc")
);
const prefetchLinkResources = (elm, isOnVisible) => {
  var _a2;
  const prefetchUrl =
    (_a2 = elm == null ? void 0 : elm.dataset) == null ? void 0 : _a2.prefetch;
  if (prefetchUrl) {
    if (!windowInnerWidth) windowInnerWidth = window.innerWidth;
    if (!isOnVisible || (isOnVisible && windowInnerWidth < 520))
      loadClientData(prefetchUrl);
  }
};
let windowInnerWidth = 0;
const swRegister =
  '((s,a,r,i)=>{r=(e,t)=>{t=document.querySelector("[q\\\\:base]"),t&&a.active&&a.active.postMessage({type:"qprefetch",base:t.getAttribute("q:base"),...e})},addEventListener("qprefetch",e=>{const t=e.detail;a?r(t):t.bundles&&s.push(...t.bundles)}),navigator.serviceWorker.register("/service-worker.js").then(e=>{i=()=>{a=e,r({bundles:s})},e.installing?e.installing.addEventListener("statechange",t=>{t.target.state=="activated"&&i()}):e.active&&i()}).catch(e=>console.error(e))})([])';
const ServiceWorkerRegister = () =>
  jsx("script", {
    dangerouslySetInnerHTML: swRegister,
  });
const RouterHead = /* @__PURE__ */ componentQrl(
  inlinedQrl(() => {
    const head2 = useDocumentHead();
    const loc = useLocation();
    return /* @__PURE__ */ jsx(Fragment, {
      children: [
        /* @__PURE__ */ jsx("title", {
          children: head2.title,
        }),
        /* @__PURE__ */ jsx("link", {
          rel: "canonical",
          href: loc.href,
        }),
        /* @__PURE__ */ jsx("meta", {
          name: "viewport",
          content: "width=device-width, initial-scale=1.0",
        }),
        /* @__PURE__ */ jsx("link", {
          rel: "shortcut icon",
          type: "image/svg+xml",
          href: "/favicon.svg",
        }),
        /* @__PURE__ */ jsx("link", {
          rel: "stylesheet",
          href: "https://unpkg.com/aos@next/dist/aos.css",
        }),
        /* @__PURE__ */ jsx("link", {
          rel: "preconnect",
          href: "https://fonts.googleapis.com",
        }),
        /* @__PURE__ */ jsx("link", {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "",
        }),
        /* @__PURE__ */ jsx("link", {
          href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@200;300;400&display=swap",
          rel: "stylesheet",
        }),
        /* @__PURE__ */ jsx("meta", {
          property: "og:site_name",
          content: "Qwiktober 2022",
        }),
        /* @__PURE__ */ jsx("meta", {
          name: "twitter:site",
          content: "@imamdev_",
        }),
        /* @__PURE__ */ jsx("meta", {
          name: "twitter:title",
          content: "Qwiktober 2022",
        }),
        head2.meta.map((m) =>
          /* @__PURE__ */ jsx("meta", {
            ...m,
          })
        ),
        head2.links.map((l) =>
          /* @__PURE__ */ jsx("link", {
            ...l,
          })
        ),
        head2.styles.map((s) =>
          /* @__PURE__ */ jsx("style", {
            ...s.props,
            dangerouslySetInnerHTML: s.style,
          })
        ),
      ],
    });
  }, "s_zrbrqoaqXSY")
);
const global$1 = "";
const Root = /* @__PURE__ */ componentQrl(
  inlinedQrl(() => {
    return /* @__PURE__ */ jsx(QwikCity, {
      children: [
        /* @__PURE__ */ jsx("head", {
          children: [
            /* @__PURE__ */ jsx("meta", {
              charSet: "utf-8",
            }),
            /* @__PURE__ */ jsx("meta", {
              "http-equiv": "X-UA-Compatible",
              content: "IE=edge",
            }),
            /* @__PURE__ */ jsx(RouterHead, {}),
          ],
        }),
        /* @__PURE__ */ jsx("body", {
          lang: "en",
          children: [
            /* @__PURE__ */ jsx(RouterOutlet, {}),
            /* @__PURE__ */ jsx(ServiceWorkerRegister, {}),
            /* @__PURE__ */ jsx("script", {
              src: "https://unpkg.com/aos@next/dist/aos.js",
            }),
            /* @__PURE__ */ jsx("script", {
              children: "AOS.init();",
            }),
          ],
        }),
      ],
    });
  }, "s_3sccYCDd1Z0")
);
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) =>
  key in obj
    ? __defProp(obj, key, {
        enumerable: true,
        configurable: true,
        writable: true,
        value,
      })
    : (obj[key] = value);
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop)) __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop)) __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
function render(opts) {
  return renderToStream(
    /* @__PURE__ */ jsx(Root, {}),
    __spreadProps(
      __spreadValues(
        {
          manifest,
        },
        opts
      ),
      {
        prefetchStrategy: {
          implementation: {
            linkInsert: null,
            workerFetchInsert: null,
            prefetchEvent: "always",
          },
        },
      }
    )
  );
}
const qwikCityHandler = qwikCity(render);
export { qwikCityHandler as default };
