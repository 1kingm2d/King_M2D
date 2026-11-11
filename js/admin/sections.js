/* Describes every admin form. To add a field, add one line here. kind: text | textarea | url | email | check | select | lines | image */
import { PLATFORMS } from "../config.js";

function f(path, label, kind, extra) {
  return Object.assign({ path: path, label: label, kind: kind }, extra || {});
}

export const FILE_DEFAULTS = {
  site: {},
  downloads: { updated: "", categories: [], items: [] },
  merch: { products: [] },
  pinned: { posts: [] }
};

const platformFields = PLATFORMS.map(function (p) { return f("links." + p.key, p.label + " link", "url", { help: "Leave empty to hide it everywhere." }); });

export const SECTIONS = [
  {
    id: "brand", title: "Brand and About",
    blocks: [{
      type: "fields", file: "site", fields: [
        f("brand.name", "Brand name", "text", { required: true }),
        f("brand.tagline", "Tagline", "text"),
        f("brand.logo", "Logo", "image"),
        f("brand.avatar", "Avatar", "image"),
        f("about.story", "About story", "textarea", { help: "A blank line starts a new paragraph." }),
        f("about.gear", "Gear and software list", "lines"),
        f("about.skills", "Skills", "lines")
      ]
    }]
  },
  {
    id: "links", title: "Links and Emails",
    intro: "Empty links are hidden automatically. Fan email receives Fan Corner messages; Business email powers the hire buttons.",
    blocks: [
      { type: "fields", file: "site", title: "Social links", fields: platformFields.concat([f("merch.storeUrl", "Merch store (Shop button)", "url")]) },
      {
        type: "fields", file: "site", title: "Emails", fields: [
          f("emails.fans.label", "Fan email label", "text"),
          f("emails.fans.address", "Fan email address", "email"),
          f("emails.fans.visible", "Show fan email on the site", "check", { on: true }),
          f("emails.business.label", "Business email label", "text"),
          f("emails.business.address", "Business email address", "email"),
          f("emails.business.visible", "Show business email on the site", "check", { on: true })
        ]
      }
    ]
  },
  {
    id: "widgets", title: "Widgets",
    blocks: [{
      type: "fields", file: "site", fields: [
        f("youtubeChannelId", "YouTube channel ID", "text", { pattern: /^UC[\w-]{22}$/, patternMsg: "should start with UC and be 24 characters", help: "Used by the auto-update workflow. Leave empty to skip." }),
        f("behold", "Behold embed code, widget URL or feed ID", "textarea", { help: "Instagram feed. If empty or over the free limit, pinned posts are shown." }),
        f("facebookPageUrl", "Facebook Page URL", "url", { help: "Works for Pages only, not personal profiles." })
      ]
    }]
  },
  {
    id: "pinned", title: "Instagram pinned posts",
    intro: "Shown when the Instagram widget is empty or fails.",
    blocks: [{
      type: "list", file: "pinned", path: "posts", label: "post", titleKey: "caption",
      blank: { id: "", image: "", caption: "", link: "" },
      fields: [f("image", "Image", "image"), f("caption", "Caption", "text"), f("link", "Link to the Instagram post", "url")]
    }]
  },
  {
    id: "downloads", title: "Downloads",
    blocks: [
      { type: "fields", file: "downloads", title: "Categories", fields: [f("categories", "Category names", "lines")] },
      {
        type: "list", file: "downloads", path: "items", label: "download", titleKey: "name",
        blank: { id: "", name: "", description: "", category: "", fileType: "", size: "", license: "", url: "", patreonOnly: false, featured: false },
        fields: [
          f("name", "Name", "text", { required: true }), f("description", "Description", "textarea"),
          f("category", "Category", "text"), f("fileType", "File type (for example .blend)", "text"),
          f("size", "Size (for example 24 MB)", "text"), f("license", "License note", "text"),
          f("url", "Download or external link", "url"), f("patreonOnly", "Patreon only", "check"),
          f("featured", "Show on Home", "check")
        ]
      }
    ]
  },
  {
    id: "merch", title: "Merch",
    blocks: [{
      type: "list", file: "merch", path: "products", label: "product", titleKey: "name",
      blank: { id: "", name: "", price: "", image: "", link: "" },
      fields: [f("name", "Name", "text", { required: true }), f("price", "Price", "text"), f("image", "Image", "image"), f("link", "Product link", "url")]
    }]
  },
  {
    id: "support", title: "Support",
    blocks: [
      { type: "fields", file: "site", fields: [f("support.intro", "Intro text", "textarea")] },
      {
        type: "list", file: "site", path: "support.tiers", label: "tier", titleKey: "name",
        blank: { name: "", price: "", benefits: [] },
        fields: [f("name", "Tier name", "text", { required: true }), f("price", "Price", "text"), f("benefits", "Benefits", "lines")]
      }
    ]
  },
  {
    id: "fan", title: "Fan Corner",
    blocks: [{
      type: "fields", file: "site", fields: [
        f("fanCorner.enabled", "Fan Corner is on", "check", { on: true }),
        f("fanCorner.service", "Form service", "select", { options: [["web3forms", "Web3Forms"], ["formspree", "Formspree"]] }),
        f("fanCorner.endpoint", "Public access key or endpoint", "text", { help: "Web3Forms: paste the access key. Formspree: paste the form ID or full URL. Empty = mailto fallback to the fan email." })
      ]
    }]
  },
  {
    id: "wwm", title: "Work With Me",
    blocks: [
      {
        type: "fields", file: "site", fields: [
          f("workWithMe.enabled", "Show the Work With Me section (master switch)", "check", { on: true }),
          f("workWithMe.status", "Availability", "select", { options: [["available", "Available for work"], ["limited", "Limited availability"], ["unavailable", "Not taking work right now"]] }),
          f("workWithMe.offer", "What I offer", "textarea"),
          f("workWithMe.note", "Pricing / process note", "textarea")
        ]
      },
      {
        type: "list", file: "site", path: "workWithMe.buttons", label: "button", titleKey: "label",
        blank: { id: "", label: "", link: "", enabled: true },
        fields: [
          f("label", "Button label", "text", { required: true }),
          f("link", "Link (empty = mailto the business email)", "url"),
          f("enabled", "Show this button", "check", { on: true })
        ]
      }
    ]
  }
];