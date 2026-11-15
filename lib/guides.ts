export type Block =
  | { t: "h2"; text: string }
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] };

export type Guide = {
  slug: string;
  title: string; // page <title> and H1
  description: string;
  tool: string; // slug of the related tool
  cta: string;
  steps: string[]; // short "quick steps" list at the top
  body: Block[];
  faqs: { q: string; a: string }[];
  related: string[]; // other guide slugs
};

export const PUBLISHED = "2026-11-15";

export const GUIDES: Guide[] = [
  {
    slug: "merge-pdfs-without-uploading",
    title: "How to merge PDF files without uploading them",
    description: "Combine several PDFs into one for free, in your browser. Your files never leave your device, and there is no signup or watermark.",
    tool: "organize", cta: "Merge PDFs now",
    steps: ["Open the Merge & Organize tool and add your PDFs.", "Drag the pages into the order you want.", "Select pages to rotate or delete if needed.", "Click Export PDF."],
    body: [
      { t: "p", text: "Most online PDF mergers upload your documents to a server. For contracts, invoices, IDs or medical papers, that is not ideal. This guide uses a merger that does the work inside your browser, so the files stay on your computer or phone." },
      { t: "h2", text: "Step by step" },
      { t: "ol", items: [
        "Open the Merge & Organize PDF tool and drop in two or more PDFs. You can add more files at any time.",
        "Every page of every file appears as a thumbnail. Drag thumbnails to reorder them, including pages from different files mixed together.",
        "Click a page to select it. Use the toolbar to rotate selected pages or delete the ones you don't want.",
        "Click Export PDF. The merged file downloads straight to your device.",
      ] },
      { t: "h2", text: "Merge only some pages" },
      { t: "p", text: "You don't have to merge whole files. Delete the pages you don't need before exporting, or select just the pages you want and use Extract selected to download only those." },
      { t: "h2", text: "How to check that nothing is uploaded" },
      { t: "p", text: "Open your browser's developer tools (F12), go to the Network tab, and merge a file. You will see the page's own scripts load, but no request carrying your document. That is the difference between a browser-based tool and an upload-based one." },
      { t: "h2", text: "Tips" },
      { t: "ul", items: [
        "Very large files depend on your device's memory. If the browser struggles, merge in smaller batches.",
        "Password-protected PDFs need to be unlocked first. Use the Unlock PDF tool if you know the password.",
        "Merging keeps text and images as they are. Nothing is converted to pictures.",
      ] },
    ],
    faqs: [
      { q: "Is there a limit on how many PDFs I can merge?", a: "There is no daily limit and no signup. Practical limits come from your device's memory, and each file can be up to 50 MB." },
      { q: "Will the merged PDF have a watermark?", a: "No. The output is only your pages." },
      { q: "Does it work on a phone?", a: "Yes, in any modern mobile browser." },
    ],
    related: ["split-a-pdf-into-separate-pages", "compress-pdf-keep-text-selectable"],
  },
  {
    slug: "compress-pdf-keep-text-selectable",
    title: "How to compress a PDF and keep the text selectable",
    description: "Make a PDF smaller for email or upload without turning your text into pictures. Free, in your browser, no signup.",
    tool: "compress", cta: "Compress a PDF now",
    steps: ["Open the Compress tool and choose your PDF.", "Pick a quality level.", "Check the new size.", "Download the smaller file."],
    body: [
      { t: "p", text: "Many PDF shrinkers work by turning every page into an image. The file gets smaller, but you can no longer select, copy or search the text. This tool avoids that by default: it shrinks only the photos and scans inside the PDF and leaves text, fonts and vector graphics alone." },
      { t: "h2", text: "Step by step" },
      { t: "ol", items: [
        "Open the Compress PDF tool and choose your file.",
        "Pick a quality level: Smallest file, Balanced (good for email) or Best quality.",
        "Click Compress PDF. You'll see the before and after size.",
        "Download the result if it is smaller.",
      ] },
      { t: "h2", text: "What kinds of PDFs shrink the most" },
      { t: "ul", items: [
        "Scanned documents and PDFs full of photos. Those are mostly large images, which can be re-encoded at a lower quality.",
        "PDFs exported from slide decks with big pictures.",
        "Mostly-text PDFs are already small. If there is nothing meaningful to remove, the tool tells you instead of giving you a bigger file.",
      ] },
      { t: "h2", text: "When you need the smallest possible file" },
      { t: "p", text: "Tick Maximum reduction to turn every page into an image. This can shrink stubborn files further, but the text is no longer selectable or searchable. If you need the text back afterwards, run the result through the OCR tool." },
      { t: "h2", text: "Tips" },
      { t: "ul", items: [
        "Keep your original. Compression loses image detail, and you can't undo it.",
        "If you need to email a file under a size limit, try Balanced first, then Smallest.",
        "Scanned a document with your phone? Use black & white in the Scan to PDF tool to get a smaller file from the start.",
      ] },
    ],
    faqs: [
      { q: "Why didn't my PDF get smaller?", a: "If it is mostly text, it is already well optimized and there is little to remove. Try Maximum reduction only if you don't need selectable text." },
      { q: "Is my file uploaded?", a: "No. Compression runs in your browser." },
      { q: "Will image quality drop?", a: "Yes, a little, depending on the level you choose. Best quality keeps images sharpest." },
    ],
    related: ["scan-documents-to-pdf-with-your-phone", "merge-pdfs-without-uploading"],
  },
  {
    slug: "remove-a-pdf-password-you-know",
    title: "How to remove a password from a PDF you know the password for",
    description: "Save an unlocked copy of a password-protected PDF so it opens without typing the password every time. Free and private.",
    tool: "unlock", cta: "Unlock a PDF now",
    steps: ["Open the Unlock PDF tool and choose the file.", "Type its current password.", "Click Unlock PDF.", "Download the copy with no password."],
    body: [
      { t: "p", text: "A password-protected PDF is a nuisance if you open it every day on your own computer. If you know the password, you can save a copy that opens without one." },
      { t: "p", text: "This only works when you know the password. It can't crack or guess a password, and you should only unlock documents you own or have permission to change." },
      { t: "h2", text: "Step by step" },
      { t: "ol", items: [
        "Open the Unlock PDF tool and choose the protected file.",
        "Enter the password you normally use to open it.",
        "Click Unlock PDF. If the password is right, a decrypted copy downloads. If not, you'll see an error and can try again.",
      ] },
      { t: "h2", text: "Privacy" },
      { t: "p", text: "The work happens in your browser using a WebAssembly version of the open-source qpdf program. Your file and your password are not sent anywhere." },
      { t: "h2", text: "If it doesn't work" },
      { t: "ul", items: [
        "Check for typos and the caps lock key. PDF passwords are case-sensitive.",
        "A very old or unusual encryption method might not be supported.",
        "If you forgot the password, there is no legitimate way to recover it from the file.",
      ] },
      { t: "h2", text: "Want to protect a file instead?" },
      { t: "p", text: "The Protect PDF tool does the opposite: it locks a PDF with a password using AES-256 encryption." },
    ],
    faqs: [
      { q: "Can this remove a password I forgot?", a: "No. You need to know the password. The tool only removes protection from files you can already open." },
      { q: "Is it legal?", a: "Use it only on documents you own or have permission to modify." },
      { q: "Is my password sent to a server?", a: "No. It stays in your browser." },
    ],
    related: ["password-protect-a-pdf", "merge-pdfs-without-uploading"],
  },
  {
    slug: "split-a-pdf-into-separate-pages",
    title: "How to split a PDF into separate pages or page ranges",
    description: "Pull pages out of a PDF, or break it into several files, using simple ranges like 1-3, 5, 8-. Free and in your browser.",
    tool: "split", cta: "Split a PDF now",
    steps: ["Open the Split PDF tool and choose your file.", "Choose By page range or Every page.", "For ranges, type something like 1-3, 5, 8-.", "Download the result."],
    body: [
      { t: "p", text: "Splitting a PDF means taking some of its pages out as new files. You might want chapter 2 of a long report, or to send just one page of a form." },
      { t: "h2", text: "Step by step" },
      { t: "ol", items: [
        "Open the Split PDF tool and choose your file. It shows how many pages the PDF has.",
        "Choose By page range to enter exactly which pages you want, or Every page to get one file per page.",
        "Click Split PDF. One result downloads as a PDF. Several results arrive together in a zip file.",
      ] },
      { t: "h2", text: "How page ranges work" },
      { t: "p", text: "Separate items with commas. Each item becomes its own PDF." },
      { t: "ul", items: [
        "5 gives you page 5 as a single-page PDF.",
        "2-4 gives you one PDF containing pages 2, 3 and 4.",
        "8- means from page 8 to the last page, and -3 means pages 1 to 3.",
        "1-3, 7, 10- creates three PDFs: pages 1–3, page 7, and page 10 to the end.",
      ] },
      { t: "h2", text: "Tips" },
      { t: "ul", items: [
        "If you want the selected pages in one file but in a different order, use the Merge & Organize tool and its Extract selected button.",
        "If a page number is outside the document, the tool tells you the valid range.",
        "Everything runs in your browser. Your file isn't uploaded.",
      ] },
    ],
    faqs: [
      { q: "What if I want several pages in one new PDF?", a: "Use a range such as 2-4. Pages inside a range stay together in one file." },
      { q: "Is there a page limit?", a: "No set limit. Files up to 50 MB work, depending on your device." },
      { q: "Will the pages keep their text and quality?", a: "Yes. Pages are copied as they are." },
    ],
    related: ["merge-pdfs-without-uploading", "compress-pdf-keep-text-selectable"],
  },
  {
    slug: "scan-documents-to-pdf-with-your-phone",
    title: "How to scan documents to PDF with your phone camera",
    description: "Turn paper into a clean PDF using just your phone or webcam. No app to install, no signup, and your photos stay on your device.",
    tool: "scan", cta: "Scan to PDF now",
    steps: ["Open the Scan to PDF tool and allow the camera.", "Capture each page.", "Choose a filter such as Black & white.", "Reorder if needed and create your PDF."],
    body: [
      { t: "p", text: "You don't need a scanner app. The Scan to PDF tool works in your phone's or laptop's browser: capture pages, clean them up, and save them as one PDF." },
      { t: "h2", text: "Step by step" },
      { t: "ol", items: [
        "Open the Scan to PDF tool and tap Open camera. Allow camera access when your browser asks.",
        "Hold your phone above the page and tap Capture for each page. You can also add photos you already took.",
        "Pick a filter: Original for photos, Grayscale, or Black & white for clean text pages.",
        "Use the arrows to reorder pages and the bin icon to remove a bad shot, then tap Create PDF.",
      ] },
      { t: "h2", text: "Get a better scan" },
      { t: "ul", items: [
        "Use even light. Avoid shadows from your hand or phone.",
        "Place the page on a plain, dark surface so the edges stand out.",
        "Keep the phone parallel to the page and fill the frame.",
        "Choose Black & white for printed text. It gives the cleanest result and the smallest file.",
      ] },
      { t: "h2", text: "What it doesn't do yet" },
      { t: "p", text: "There is no automatic edge detection or cropping yet. If you need a page cropped tightly, crop the photo in your phone's gallery first, then add it. To make the text searchable, run the finished PDF through the OCR tool." },
      { t: "h2", text: "Privacy" },
      { t: "p", text: "Photos are processed in your browser and are not uploaded." },
    ],
    faqs: [
      { q: "Does it work on iPhone and Android?", a: "It is designed to work in modern mobile browsers. If the camera doesn't open, check that camera permission is allowed for your browser." },
      { q: "Can I use existing photos?", a: "Yes. Use Add photos to choose images from your device." },
      { q: "Can I make the scanned text searchable?", a: "Run the resulting PDF through the OCR tool to extract the text." },
    ],
    related: ["compress-pdf-keep-text-selectable", "merge-pdfs-without-uploading"],
  },
  {
    slug: "password-protect-a-pdf",
    title: "How to password protect a PDF with AES-256 encryption",
    description: "Lock a PDF with a password so only people who know it can open it. Free, private, and done in your browser.",
    tool: "protect", cta: "Protect a PDF now",
    steps: ["Open the Protect PDF tool and choose your file.", "Type a password twice.", "Click Protect PDF.", "Download the encrypted copy."],
    body: [
      { t: "p", text: "A password on a PDF means it can't be opened without that password, even if the file ends up in the wrong inbox. This is useful for payslips, contracts, medical documents and anything else you wouldn't want read by accident." },
      { t: "h2", text: "Step by step" },
      { t: "ol", items: [
        "Open the Protect PDF tool and choose your file.",
        "Type a password, then type it again to confirm. The button stays disabled until they match.",
        "Click Protect PDF and download the encrypted copy.",
        "Try opening the new file to confirm that it asks for the password.",
      ] },
      { t: "h2", text: "Choosing a good password" },
      { t: "ul", items: [
        "Use a long phrase of several unrelated words rather than a short, clever one.",
        "Don't reuse a password from your email or banking.",
        "Send the password through a different channel than the file, for example by phone or a separate message.",
      ] },
      { t: "h2", text: "Important to know" },
      { t: "ul", items: [
        "If you forget the password, it cannot be recovered. Keep the original, unprotected file somewhere safe.",
        "The tool uses AES-256, the standard strong encryption supported by modern PDF viewers. Very old viewers may not open it.",
        "Your file and password are processed in your browser and are not uploaded.",
      ] },
      { t: "h2", text: "Need to remove the password later?" },
      { t: "p", text: "If you know the password, the Unlock PDF tool saves a copy without it." },
    ],
    faqs: [
      { q: "How strong is the encryption?", a: "AES-256 using the open-source qpdf library, running in your browser." },
      { q: "Can I recover the password if I forget it?", a: "No. Keep the password and an unprotected original safe." },
      { q: "Is my password sent anywhere?", a: "No. Nothing leaves your device." },
    ],
    related: ["remove-a-pdf-password-you-know", "merge-pdfs-without-uploading"],
  },
];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);
