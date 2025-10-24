import { jsx as P } from "react/jsx-runtime";
import { useState as H, useLayoutEffect as se, useEffect as J, useMemo as L, useRef as K, useCallback as U, memo as le, useImperativeHandle as ce, createElement as X } from "react";
function ge(e) {
  let t = e;
  for (; t; ) {
    if (t.dir)
      return t.dir === "rtl";
    t = t.parentElement;
  }
  return !1;
}
function ve(e, t) {
  const [s, r] = H(t === "rtl");
  return se(() => {
    e && (t || r(ge(e)));
  }, [t, e]), s;
}
const q = typeof window < "u" ? se : J;
function oe(e) {
  if (e !== void 0)
    switch (typeof e) {
      case "number":
        return e;
      case "string": {
        if (e.endsWith("px"))
          return parseFloat(e);
        break;
      }
    }
}
function be({
  box: e,
  defaultHeight: t,
  defaultWidth: s,
  disabled: r,
  element: n,
  mode: o,
  style: i
}) {
  const { styleHeight: f, styleWidth: l } = L(
    () => ({
      styleHeight: oe(i?.height),
      styleWidth: oe(i?.width)
    }),
    [i?.height, i?.width]
  ), [c, d] = H({
    height: t,
    width: s
  }), a = r || o === "only-height" && f !== void 0 || o === "only-width" && l !== void 0 || f !== void 0 && l !== void 0;
  return q(() => {
    if (n === null || a)
      return;
    const u = new ResizeObserver((b) => {
      for (const w of b) {
        const { contentRect: I, target: x } = w;
        n === x && d((m) => m.height === I.height && m.width === I.width ? m : {
          height: I.height,
          width: I.width
        });
      }
    });
    return u.observe(n, { box: e }), () => {
      u?.unobserve(n);
    };
  }, [e, a, n, f, l]), L(
    () => ({
      height: f ?? c.height,
      width: l ?? c.width
    }),
    [c, f, l]
  );
}
function ae(e) {
  const t = K(() => {
    throw new Error("Cannot call during render.");
  });
  return q(() => {
    t.current = e;
  }, [e]), U((s) => t.current?.(s), [t]);
}
let F = null;
function Ie(e = !1) {
  if (F === null || e) {
    const t = document.createElement("div"), s = t.style;
    s.width = "50px", s.height = "50px", s.overflow = "scroll", s.direction = "rtl";
    const r = document.createElement("div"), n = r.style;
    return n.width = "100px", n.height = "100px", t.appendChild(r), document.body.appendChild(t), t.scrollLeft > 0 ? F = "positive-descending" : (t.scrollLeft = 1, t.scrollLeft === 0 ? F = "negative" : F = "positive-ascending"), document.body.removeChild(t), F;
  }
  return F;
}
function Z({
  containerElement: e,
  direction: t,
  isRtl: s,
  scrollOffset: r
}) {
  if (t === "horizontal" && s)
    switch (Ie()) {
      case "negative":
        return -r;
      case "positive-descending": {
        if (e) {
          const { clientWidth: n, scrollLeft: o, scrollWidth: i } = e;
          return i - n - o;
        }
        break;
      }
    }
  return r;
}
function $(e, t = "Assertion error") {
  if (!e)
    throw console.error(t), Error(t);
}
function Y(e, t) {
  if (e === t)
    return !0;
  if (!!e != !!t || ($(e !== void 0), $(t !== void 0), Object.keys(e).length !== Object.keys(t).length))
    return !1;
  for (const s in e)
    if (!Object.is(t[s], e[s]))
      return !1;
  return !0;
}
function fe({
  cachedBounds: e,
  itemCount: t,
  itemSize: s
}) {
  if (t === 0)
    return 0;
  if (typeof s == "number")
    return t * s;
  {
    const r = e.get(
      e.size === 0 ? 0 : e.size - 1
    );
    $(r !== void 0, "Unexpected bounds cache miss");
    const n = (r.scrollOffset + r.size) / e.size;
    return t * n;
  }
}
function me({
  align: e,
  cachedBounds: t,
  index: s,
  itemCount: r,
  itemSize: n,
  containerScrollOffset: o,
  containerSize: i
}) {
  const f = fe({
    cachedBounds: t,
    itemCount: r,
    itemSize: n
  }), l = t.get(s), c = Math.max(
    0,
    Math.min(f - i, l.scrollOffset)
  ), d = Math.max(
    0,
    l.scrollOffset - i + l.size
  );
  switch (e === "smart" && (o >= d && o <= c ? e = "auto" : e = "center"), e) {
    case "start":
      return c;
    case "end":
      return d;
    case "center":
      return l.scrollOffset <= i / 2 ? 0 : l.scrollOffset + l.size / 2 >= f - i / 2 ? f - i : l.scrollOffset + l.size / 2 - i / 2;
    case "auto":
    default:
      return o >= d && o <= c ? o : o < d ? d : c;
  }
}
function ie({
  cachedBounds: e,
  containerScrollOffset: t,
  containerSize: s,
  itemCount: r,
  overscanCount: n
}) {
  const o = r - 1;
  let i = 0, f = -1, l = 0, c = -1, d = 0;
  for (; d < o; ) {
    const a = e.get(d);
    if (a.scrollOffset + a.size > t)
      break;
    d++;
  }
  for (i = d, l = Math.max(0, i - n); d < o; ) {
    const a = e.get(d);
    if (a.scrollOffset + a.size >= t + s)
      break;
    d++;
  }
  return f = Math.min(o, d), c = Math.min(r - 1, f + n), i < 0 && (i = 0, f = -1, l = 0, c = -1), {
    startIndexVisible: i,
    stopIndexVisible: f,
    startIndexOverscan: l,
    stopIndexOverscan: c
  };
}
function we({
  itemCount: e,
  itemProps: t,
  itemSize: s
}) {
  const r = /* @__PURE__ */ new Map();
  return {
    get(n) {
      for ($(n < e, `Invalid index ${n}`); r.size - 1 < n; ) {
        const i = r.size;
        let f;
        switch (typeof s) {
          case "function": {
            f = s(i, t);
            break;
          }
          case "number": {
            f = s;
            break;
          }
        }
        if (i === 0)
          r.set(i, {
            size: f,
            scrollOffset: 0
          });
        else {
          const l = r.get(i - 1);
          $(
            l !== void 0,
            `Unexpected bounds cache miss for index ${n}`
          ), r.set(i, {
            scrollOffset: l.scrollOffset + l.size,
            size: f
          });
        }
      }
      const o = r.get(n);
      return $(
        o !== void 0,
        `Unexpected bounds cache miss for index ${n}`
      ), o;
    },
    set(n, o) {
      r.set(n, o);
    },
    get size() {
      return r.size;
    }
  };
}
function Oe({
  itemCount: e,
  itemProps: t,
  itemSize: s
}) {
  return L(
    () => we({
      itemCount: e,
      itemProps: t,
      itemSize: s
    }),
    [e, t, s]
  );
}
function ye({
  containerSize: e,
  itemSize: t
}) {
  let s;
  switch (typeof t) {
    case "string": {
      $(
        t.endsWith("%"),
        `Invalid item size: "${t}"; string values must be percentages (e.g. "100%")`
      ), $(
        e !== void 0,
        "Container size must be defined if a percentage item size is specified"
      ), s = e * parseInt(t) / 100;
      break;
    }
    default: {
      s = t;
      break;
    }
  }
  return s;
}
function ee({
  containerElement: e,
  containerStyle: t,
  defaultContainerSize: s = 0,
  direction: r,
  isRtl: n = !1,
  itemCount: o,
  itemProps: i,
  itemSize: f,
  onResize: l,
  overscanCount: c
}) {
  const [d, a] = H({
    startIndexVisible: 0,
    startIndexOverscan: 0,
    stopIndexVisible: -1,
    stopIndexOverscan: -1
  }), {
    startIndexVisible: u,
    startIndexOverscan: b,
    stopIndexVisible: w,
    stopIndexOverscan: I
  } = {
    startIndexVisible: Math.min(o - 1, d.startIndexVisible),
    startIndexOverscan: Math.min(o - 1, d.startIndexOverscan),
    stopIndexVisible: Math.min(o - 1, d.stopIndexVisible),
    stopIndexOverscan: Math.min(o - 1, d.stopIndexOverscan)
  }, { height: x = s, width: m = s } = be({
    defaultHeight: r === "vertical" ? s : void 0,
    defaultWidth: r === "horizontal" ? s : void 0,
    element: e,
    mode: r === "vertical" ? "only-height" : "only-width",
    style: t
  }), y = K({
    height: 0,
    width: 0
  }), E = r === "vertical" ? x : m, h = ye({ containerSize: E, itemSize: f });
  se(() => {
    if (typeof l == "function") {
      const p = y.current;
      (p.height !== x || p.width !== m) && (l({ height: x, width: m }, { ...p }), p.height = x, p.width = m);
    }
  }, [x, l, m]);
  const z = Oe({
    itemCount: o,
    itemProps: i,
    itemSize: h
  }), k = U(
    (p) => z.get(p),
    [z]
  ), S = U(
    () => fe({
      cachedBounds: z,
      itemCount: o,
      itemSize: h
    }),
    [z, o, h]
  ), W = U(
    (p) => {
      const T = Z({
        containerElement: e,
        direction: r,
        isRtl: n,
        scrollOffset: p
      });
      return ie({
        cachedBounds: z,
        containerScrollOffset: T,
        containerSize: E,
        itemCount: o,
        overscanCount: c
      });
    },
    [
      z,
      e,
      E,
      r,
      n,
      o,
      c
    ]
  );
  q(() => {
    const p = (r === "vertical" ? e?.scrollTop : e?.scrollLeft) ?? 0;
    a(W(p));
  }, [e, r, W]), q(() => {
    if (!e)
      return;
    const p = () => {
      a((T) => {
        const { scrollLeft: R, scrollTop: v } = e, g = Z({
          containerElement: e,
          direction: r,
          isRtl: n,
          scrollOffset: r === "vertical" ? v : R
        }), A = ie({
          cachedBounds: z,
          containerScrollOffset: g,
          containerSize: E,
          itemCount: o,
          overscanCount: c
        });
        return Y(A, T) ? T : A;
      });
    };
    return e.addEventListener("scroll", p), () => {
      e.removeEventListener("scroll", p);
    };
  }, [
    z,
    e,
    E,
    r,
    o,
    c
  ]);
  const O = ae(
    ({
      align: p = "auto",
      containerScrollOffset: T,
      index: R
    }) => {
      let v = me({
        align: p,
        cachedBounds: z,
        containerScrollOffset: T,
        containerSize: E,
        index: R,
        itemCount: o,
        itemSize: h
      });
      if (e) {
        if (v = Z({
          containerElement: e,
          direction: r,
          isRtl: n,
          scrollOffset: v
        }), typeof e.scrollTo != "function") {
          const g = W(v);
          Y(d, g) || a(g);
        }
        return v;
      }
    }
  );
  return {
    getCellBounds: k,
    getEstimatedSize: S,
    scrollToIndex: O,
    startIndexOverscan: b,
    startIndexVisible: u,
    stopIndexOverscan: I,
    stopIndexVisible: w
  };
}
function de(e) {
  return L(() => e, Object.values(e));
}
function ue(e, t) {
  const {
    ariaAttributes: s,
    style: r,
    ...n
  } = e, {
    ariaAttributes: o,
    style: i,
    ...f
  } = t;
  return Y(s, o) && Y(r, i) && Y(n, f);
}
function Ve({
  cellComponent: e,
  cellProps: t,
  children: s,
  className: r,
  columnCount: n,
  columnWidth: o,
  defaultHeight: i = 0,
  defaultWidth: f = 0,
  dir: l,
  gridRef: c,
  onCellsRendered: d,
  onResize: a,
  overscanCount: u = 3,
  rowCount: b,
  rowHeight: w,
  style: I,
  tagName: x = "div",
  ...m
}) {
  const y = de(t), E = L(
    () => le(e, ue),
    [e]
  ), [h, z] = H(null), k = ve(h, l), {
    getCellBounds: S,
    getEstimatedSize: W,
    startIndexOverscan: O,
    startIndexVisible: p,
    scrollToIndex: T,
    stopIndexOverscan: R,
    stopIndexVisible: v
  } = ee({
    containerElement: h,
    containerStyle: I,
    defaultContainerSize: f,
    direction: "horizontal",
    isRtl: k,
    itemCount: n,
    itemProps: y,
    itemSize: o,
    onResize: a,
    overscanCount: u
  }), {
    getCellBounds: g,
    getEstimatedSize: A,
    startIndexOverscan: M,
    startIndexVisible: re,
    scrollToIndex: Q,
    stopIndexOverscan: _,
    stopIndexVisible: ne
  } = ee({
    containerElement: h,
    containerStyle: I,
    defaultContainerSize: i,
    direction: "vertical",
    itemCount: b,
    itemProps: y,
    itemSize: w,
    onResize: a,
    overscanCount: u
  });
  ce(
    c,
    () => ({
      get element() {
        return h;
      },
      scrollToCell({
        behavior: B = "auto",
        columnAlign: V = "auto",
        columnIndex: j,
        rowAlign: D = "auto",
        rowIndex: G
      }) {
        const N = T({
          align: V,
          containerScrollOffset: h?.scrollLeft ?? 0,
          index: j
        }), xe = Q({
          align: D,
          containerScrollOffset: h?.scrollTop ?? 0,
          index: G
        });
        typeof h?.scrollTo == "function" && h.scrollTo({
          behavior: B,
          left: N,
          top: xe
        });
      },
      scrollToColumn({
        align: B = "auto",
        behavior: V = "auto",
        index: j
      }) {
        const D = T({
          align: B,
          containerScrollOffset: h?.scrollLeft ?? 0,
          index: j
        });
        typeof h?.scrollTo == "function" && h.scrollTo({
          behavior: V,
          left: D
        });
      },
      scrollToRow({
        align: B = "auto",
        behavior: V = "auto",
        index: j
      }) {
        const D = Q({
          align: B,
          containerScrollOffset: h?.scrollTop ?? 0,
          index: j
        });
        typeof h?.scrollTo == "function" && h.scrollTo({
          behavior: V,
          top: D
        });
      }
    }),
    [h, T, Q]
  ), J(() => {
    O >= 0 && R >= 0 && M >= 0 && _ >= 0 && d && d(
      {
        columnStartIndex: p,
        columnStopIndex: v,
        rowStartIndex: re,
        rowStopIndex: ne
      },
      {
        columnStartIndex: O,
        columnStopIndex: R,
        rowStartIndex: M,
        rowStopIndex: _
      }
    );
  }, [
    d,
    O,
    p,
    R,
    v,
    M,
    re,
    _,
    ne
  ]);
  const he = L(() => {
    const B = [];
    if (n > 0 && b > 0)
      for (let V = M; V <= _; V++) {
        const j = g(V), D = [];
        for (let G = O; G <= R; G++) {
          const N = S(G);
          D.push(
            /* @__PURE__ */ X(
              E,
              {
                ...y,
                ariaAttributes: {
                  "aria-colindex": G + 1,
                  role: "gridcell"
                },
                columnIndex: G,
                key: G,
                rowIndex: V,
                style: {
                  position: "absolute",
                  left: k ? void 0 : 0,
                  right: k ? 0 : void 0,
                  transform: `translate(${k ? -N.scrollOffset : N.scrollOffset}px, ${j.scrollOffset}px)`,
                  height: j.size,
                  width: N.size
                }
              }
            )
          );
        }
        B.push(
          /* @__PURE__ */ P("div", { role: "row", "aria-rowindex": V + 1, children: D }, V)
        );
      }
    return B;
  }, [
    E,
    y,
    n,
    O,
    R,
    S,
    g,
    k,
    b,
    M,
    _
  ]), pe = /* @__PURE__ */ P(
    "div",
    {
      "aria-hidden": !0,
      style: {
        height: A(),
        width: W(),
        zIndex: -1
      }
    }
  );
  return X(
    x,
    {
      "aria-colcount": n,
      "aria-rowcount": b,
      role: "grid",
      ...m,
      className: r,
      dir: l,
      ref: z,
      style: {
        position: "relative",
        width: "100%",
        height: "100%",
        maxHeight: "100%",
        maxWidth: "100%",
        flexGrow: 1,
        overflow: "auto",
        ...I
      }
    },
    he,
    s,
    pe
  );
}
const Ee = H, Re = K;
function ze(e) {
  return e != null && typeof e == "object" && "getAverageRowHeight" in e && typeof e.getAverageRowHeight == "function";
}
const te = "data-react-window-index";
function Ae({
  children: e,
  className: t,
  defaultHeight: s = 0,
  listRef: r,
  onResize: n,
  onRowsRendered: o,
  overscanCount: i = 3,
  rowComponent: f,
  rowCount: l,
  rowHeight: c,
  rowProps: d,
  tagName: a = "div",
  style: u,
  ...b
}) {
  const w = de(d), I = L(
    () => le(f, ue),
    [f]
  ), [x, m] = H(null), y = ze(c), E = L(() => y ? (v) => c.getRowHeight(v) ?? c.getAverageRowHeight() : c, [y, c]), {
    getCellBounds: h,
    getEstimatedSize: z,
    scrollToIndex: k,
    startIndexOverscan: S,
    startIndexVisible: W,
    stopIndexOverscan: O,
    stopIndexVisible: p
  } = ee({
    containerElement: x,
    containerStyle: u,
    defaultContainerSize: s,
    direction: "vertical",
    itemCount: l,
    itemProps: w,
    itemSize: E,
    onResize: n,
    overscanCount: i
  });
  ce(
    r,
    () => ({
      get element() {
        return x;
      },
      scrollToRow({
        align: v = "auto",
        behavior: g = "auto",
        index: A
      }) {
        const M = k({
          align: v,
          containerScrollOffset: x?.scrollTop ?? 0,
          index: A
        });
        typeof x?.scrollTo == "function" && x.scrollTo({
          behavior: g,
          top: M
        });
      }
    }),
    [x, k]
  ), q(() => {
    if (!x)
      return;
    const v = Array.from(x.children).filter((g, A) => {
      if (g.hasAttribute("aria-hidden"))
        return !1;
      const M = `${S + A}`;
      return g.setAttribute(te, M), !0;
    });
    if (y)
      return c.observeRowElements(v);
  }, [
    x,
    y,
    c,
    S,
    O
  ]), J(() => {
    S >= 0 && O >= 0 && o && o(
      {
        startIndex: W,
        stopIndex: p
      },
      {
        startIndex: S,
        stopIndex: O
      }
    );
  }, [
    o,
    S,
    W,
    O,
    p
  ]);
  const T = L(() => {
    const v = [];
    if (l > 0)
      for (let g = S; g <= O; g++) {
        const A = h(g);
        v.push(
          /* @__PURE__ */ X(
            I,
            {
              ...w,
              ariaAttributes: {
                "aria-posinset": g + 1,
                "aria-setsize": l,
                role: "listitem"
              },
              key: g,
              index: g,
              style: {
                position: "absolute",
                left: 0,
                transform: `translateY(${A.scrollOffset}px)`,
                // In case of dynamic row heights, don't specify a height style
                // otherwise a default/estimated height would mask the actual height
                height: y ? void 0 : A.size,
                width: "100%"
              }
            }
          )
        );
      }
    return v;
  }, [
    I,
    h,
    y,
    l,
    w,
    S,
    O
  ]), R = /* @__PURE__ */ P(
    "div",
    {
      "aria-hidden": !0,
      style: {
        height: z(),
        width: "100%",
        zIndex: -1
      }
    }
  );
  return X(
    a,
    {
      role: "list",
      ...b,
      className: t,
      ref: m,
      style: {
        position: "relative",
        maxHeight: "100%",
        flexGrow: 1,
        overflowY: "auto",
        ...u
      }
    },
    T,
    e,
    R
  );
}
function ke({
  defaultRowHeight: e,
  key: t
}) {
  const [s, r] = H({
    key: t,
    map: /* @__PURE__ */ new Map()
  });
  s.key !== t && r({
    key: t,
    map: /* @__PURE__ */ new Map()
  });
  const { map: n } = s, o = U(() => {
    let a = 0;
    return n.forEach((u) => {
      a += u;
    }), a === 0 ? e : a / n.size;
  }, [e, n]), i = U(
    (a) => {
      const u = n.get(a);
      return u !== void 0 ? u : (n.set(a, e), e);
    },
    [e, n]
  ), f = U((a, u) => {
    r((b) => {
      if (b.map.get(a) === u)
        return b;
      const w = new Map(b.map);
      return w.set(a, u), {
        ...b,
        map: w
      };
    });
  }, []), l = ae(
    (a) => {
      a.length !== 0 && a.forEach((u) => {
        const { borderBoxSize: b, target: w } = u, I = w.getAttribute(te);
        $(
          I !== null,
          `Invalid ${te} attribute value`
        );
        const x = parseInt(I), { blockSize: m } = b[0];
        m && f(x, m);
      });
    }
  ), [c] = H(
    () => new ResizeObserver(l)
  );
  J(() => () => {
    c.disconnect();
  }, [c]);
  const d = U(
    (a) => (a.forEach((u) => c.observe(u)), () => {
      a.forEach((u) => c.unobserve(u));
    }),
    [c]
  );
  return L(
    () => ({
      getAverageRowHeight: o,
      getRowHeight: i,
      setRowHeight: f,
      observeRowElements: d
    }),
    [o, i, f, d]
  );
}
const Le = H, Me = K;
let C = -1;
function $e(e = !1) {
  if (C === -1 || e) {
    const t = document.createElement("div"), s = t.style;
    s.width = "50px", s.height = "50px", s.overflow = "scroll", document.body.appendChild(t), C = t.offsetWidth - t.clientWidth, document.body.removeChild(t);
  }
  return C;
}
export {
  Ve as Grid,
  Ae as List,
  $e as getScrollbarSize,
  ke as useDynamicRowHeight,
  Ee as useGridCallbackRef,
  Re as useGridRef,
  Le as useListCallbackRef,
  Me as useListRef
};
//# sourceMappingURL=react-window.js.map
