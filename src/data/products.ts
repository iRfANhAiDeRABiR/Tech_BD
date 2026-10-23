import type { Product, ProductOption, ProductSummary, StoreCategory } from "@/types/product";

interface StoreCatalog {
  products: Product[];
  categories: StoreCategory[];
}

export const products: Product[] = [

    {
        "id": "1",
        "name": "Windows 11 Pro",
        "category": "windows",
        "badge": "hot",
        "price": 500,
        "originalPrice": 13500,
        "desc": "💠Original Retail License KEY.<br>\n\n💠1 PC 1 Key Lifetime Activation.<br>\n\n💠Digital License & Online Activation.<br>\n\n\n💠License Will Be Linked With Your Microsoft Account.<br>\n\n💠Have to Activate by 24 hrs after Delivery.<br>\n\n",
        "longDesc": "<h1>Windows 11 Pro Genuine License Key</h1>\n        <p>Activate your Windows 11 Pro for life with a <strong>100% original and genuine</strong> license key. Choose between a <em>Retail Key</em> (transferable and reusable) or an <em>OEM/BIND Key</em> (hardware-locked but auto-reactivates after reinstall).</p>\n        <p>Perfect for students, professionals, and businesses who want the full power of Windows 11 Pro at the best price in Bangladesh.</p>\n    </header>\n\n    <hr>\n\n    <section id=\"key-features\">\n        <h2>Key Features</h2>\n        <ul>\n            <li><strong>Lifetime Validity:</strong> One-time activation</li>\n            <li><strong>Retail Key:</strong> Transferable, reusable, and supports upgrade from Home to Pro</li>\n            <li><strong>OEM/BIND Key:</strong> Locked to device hardware, but auto-reactivates after format</li>\n            <li><strong>Global License:</strong> Works worldwide, multilingual</li>\n            <li><strong>Instant Delivery:</strong> Sent via Email</li>\n            <li><strong>100% Genuine:</strong> Verified Microsoft Reseller</li>\n            <li><strong>24/7 Support:</strong> Live Chat and WhatsApp</li>\n            <li><strong>Guarantee:</strong> Money-back Guarantee</li>\n        </ul>\n    </section>\n\n    <section id=\"comparison\">\n        <h2>Key Comparison: Retail vs. OEM/BIND</h2>\n        <table border=\"1\" cellpadding=\"10\" cellspacing=\"0\" style=\"width:100%; border-collapse: collapse;\">\n            <thead>\n                <tr style=\"background-color: #f2f2f2;\">\n                    <th>Feature</th>\n                    <th>Retail Key</th>\n                    <th>OEM/BIND Key</th>\n                </tr>\n            </thead>\n            <tbody>\n                <tr>\n                    <td><strong>Transferable</strong></td>\n                    <td>Yes – Can be used on new devices</td>\n                    <td>No – Locked to a single PC</td>\n                </tr>\n                <tr>\n                    <td><strong>Reusability</strong></td>\n                    <td>Manual reactivation possible</td>\n                    <td>Auto-reactivates on same PC</td>\n                </tr>\n                <tr>\n                    <td><strong>Upgrade Support</strong></td>\n                    <td>Can upgrade from Home to Pro</td>\n                    <td>Only for clean install</td>\n                </tr>\n                <tr>\n                    <td><strong>Price</strong></td>\n                    <td>Slightly higher</td>\n                    <td>More affordable</td>\n                </tr>\n                <tr>\n                    <td><strong>Best For</strong></td>\n                    <td>Users who may upgrade their PC later</td>\n                    <td>Fixed device or single-PC users</td>\n                </tr>\n            </tbody>\n        </table>\n    </section>\n\n    <section id=\"activation-steps\">\n        <h2>Activation Steps</h2>\n        <ol>\n            <li>Go to <strong>Settings</strong> > <strong>Update & Security</strong> > <strong>Activation</strong></li>\n            <li>Click <strong>Change Product Key</strong></li>\n            <li>Enter the key you received via email</li>\n            <li>Click <strong>Next</strong>, then <strong>Activate</strong></li>\n        </ol>\n        <p><em>Your Windows 11 Pro is now permanently activated!</em></p>\n    </section>",
        "image": "/img_content/win11pro.png",
        "icon": "🪟",
        "color": "#0078D4",
        "gradient": "linear-gradient(135deg, #0078D4, #00BCF2)"
    },
    {
        "id": "2",
        "name": "Windows 11 Home",
        "category": "windows",
        "badge": "hot",
        "price": 450,
        "originalPrice": 12800,
        "desc": "Original Windows 11 Home edition.",
        "longDesc": "💠Original Retail License KEY.<br>\n\n💠1 PC 1 Key Lifetime Activation.<br>\n\n💠Digital License & Online Activation.<br>\n\n💠Auto Activation after Windows Setup.<br>\n\n💠License Will Be Linked With Your Microsoft Account.<br>\n\n💠Have to Activate by 24 hrs after Delivery.<br>\n\n💠Instant Delivery.<br>\n\n<br><h2>Delivery Information</h2>\n\n✅ Delivery time: within 5 minutes to 1 hour<br>\n✅ Instant delivery via WhatsApp<br>\n✅ Email delivery is Optional<br>\n✅ Please ensure your WhatsApp number is correct at checkout<br>\n\n<br><h2>Activation Steps</h2>\n1. Go to Settings → Activation → Change Product Key<br>\n2. Enter the license key received on WhatsApp<br>\nClick Next → Activate<br>\n3. Your Windows 11 Home will be permanently activated.<br>",
        "image": "/img_content/win11home.png",
        "icon": "🪟",
        "color": "#0078D4",
        "gradient": "linear-gradient(135deg, #0052a3, #0078D4)"
    },
    {
        "id": "3",
        "name": "Windows 10 Pro",
        "category": "windows",
        "badge": "sale",
        "price": 400,
        "originalPrice": 12500,
        "desc": "\n\n💠Original Retail License KEY.<br>\n\n💠1 PC 1 Key Lifetime Activation.<br>\n\n💠Digital License & Online Activation.<br>\n\n💠License Will Be Linked With Your Microsoft Account.<br>\n\n💠Have to Activate by 24 hrs after Delivery.<br>\n",
        "longDesc": "<h1>Windows 10 Pro Genuine License Key</h1>\n        <p>Activate your Windows 10 Pro for life with a <strong>100% original and genuine</strong> license key. Choose between a <em>Retail Key</em> (transferable and reusable) or an <em>OEM/BIND Key</em> (hardware-locked but auto-reactivates after reinstall).</p>\n        <p>Perfect for students, professionals, and businesses who want the full power of Windows 10 Pro at the best price in Bangladesh.</p>\n    </header>\n\n    <hr>\n\n    <section id=\"key-features\">\n        <h2>Key Features</h2>\n        <ul>\n            <li><strong>Lifetime Validity:</strong> One-time activation</li>\n            <li><strong>Retail Key:</strong> Transferable, reusable, and supports upgrade from Home to Pro</li>\n            <li><strong>OEM/BIND Key:</strong> Locked to device hardware, but auto-reactivates after format</li>\n            <li><strong>Global License:</strong> Works worldwide, multilingual</li>\n            <li><strong>Instant Delivery:</strong> Sent via Email</li>\n            <li><strong>100% Genuine:</strong> Verified Microsoft Reseller</li>\n            <li><strong>24/7 Support:</strong> Live Chat and WhatsApp</li>\n            <li><strong>Guarantee:</strong> Money-back Guarantee</li>\n        </ul>\n    </section>\n\n    <section id=\"comparison\">\n        <h2>Key Comparison: Retail vs. OEM/BIND</h2>\n        <table border=\"1\" cellpadding=\"10\" cellspacing=\"0\" style=\"width:100%; border-collapse: collapse;\">\n            <thead>\n                <tr style=\"background-color: #f2f2f2;\">\n                    <th>Feature</th>\n                    <th>Retail Key</th>\n                    <th>OEM/BIND Key</th>\n                </tr>\n            </thead>\n            <tbody>\n                <tr>\n                    <td><strong>Transferable</strong></td>\n                    <td>Yes – Can be used on new devices</td>\n                    <td>No – Locked to a single PC</td>\n                </tr>\n                <tr>\n                    <td><strong>Reusability</strong></td>\n                    <td>Manual reactivation possible</td>\n                    <td>Auto-reactivates on same PC</td>\n                </tr>\n                <tr>\n                    <td><strong>Upgrade Support</strong></td>\n                    <td>Can upgrade from Home to Pro</td>\n                    <td>Only for clean install</td>\n                </tr>\n                <tr>\n                    <td><strong>Price</strong></td>\n                    <td>Slightly higher</td>\n                    <td>More affordable</td>\n                </tr>\n                <tr>\n                    <td><strong>Best For</strong></td>\n                    <td>Users who may upgrade their PC later</td>\n                    <td>Fixed device or single-PC users</td>\n                </tr>\n            </tbody>\n        </table>\n    </section>\n\n    <section id=\"activation-steps\">\n        <h2>Activation Steps</h2>\n        <ol>\n            <li>Go to <strong>Settings</strong> > <strong>Update & Security</strong> > <strong>Activation</strong></li>\n            <li>Click <strong>Change Product Key</strong></li>\n            <li>Enter the key you received via email</li>\n            <li>Click <strong>Next</strong>, then <strong>Activate</strong></li>\n        </ol>\n        <p><em>Your Windows 10 Pro is now permanently activated!</em></p>\n    </section>",
        "image": "/img_content/win10pro.png",
        "icon": "🪟",
        "color": "#0078D4",
        "gradient": "linear-gradient(135deg, #004080, #0078D4)"
    },
    {
        "id": "4",
        "name": "Microsoft Office Pro Plus LTSC 2024 Non Sync",
        "category": "office",
        "badge": "new",
        "price": 600,
        "originalPrice": 16500,
        "desc": "Microsoft Office 2024 Pro Plus License Key<br>\n🔰 For Windows 7/8/10/11 (32 & 64-bit)<br>\n🔰 Non Sync with your email.<br>\n🔰 1 time Activation.<br>\n🔰 You can not erase key from your system.<br>\n🔰 Can not Format Windows<br>\n🔰 Can not Uninstall Office<br>\n🔰 Can not Change Hardware<br>",
        "longDesc": "<h3>Office Pro Plus LTSC 2024 Non Sync(Windows Version)</h3><br>\n\n🔰 No Email Synchronization: ইমেইল দিয়ে লগইন করা যাবে, তবে সিঙ্কোনাইজেশন হবে না।<br>\n🔰 One-Time Activation: এই লাইসেন্স কেবল একবারই অ্যাক্টিভ করা যাবে।<br>\n🔰 No System Format: উইন্ডোজ ফরম্যাট করা যাবে না।<br>\n🔰 No Software Uninstallation: অফিস সফটওয়্যার আনইন্সটল করা যাবে না।<br>\n🔰 No Hardware Changes: হার্ডওয়ার পরিবর্তন করতে পারবেন না।<br>\n🔰 Single Use Only: এই লাইসেন্স পুনরায় ব্যবহারযোগ্য নয় বা অন্য কোনো পিসিতে ট্রান্সফার করা যাবে না।<br>\n🔰 Inactive After PC Issues: পিসি নষ্ট হওয়া বা আপগ্রেড করলে লাইসেন্স কী কাজ করবে না।<br>\n🔰এছাড়াও যে কোনো কারণে এটা ইনএক্টিভ হয়ে যেতে পারে যেহেতু Non Sync.<br>\n📌সেজন্য এটাকে লাইফ টাইম না বলাই ভালো কারণ উপরের কাজগুলো আপনার করা লাগতেই পারে।<br>\n\n📌 Have to Activate by 24 hrs after Delivery.<br>\n\n📢Mail Delivery (10 Minutes to 2 HRS)<br>\n\n<br><h3>Applications Included in Office 2024 Professional Plus LTSC:</h3>\n\n✔ Word 2024<br>\n\n✔ Excel 2024<br>\n\n✔ PowerPoint 2024<br>\n\n✔ Outlook 2024<br>\n\n✔ OneNote 2024<br>\n\n✔ Access 2024<br>\n\n✔ Publisher 2024<br>\n\n✔ Teams (Basic)<br>\n\n<br><h3>🔑 License Options:</h3><br>\n◉ Retail Key<br>\n ✅ Lifetime Validity – One-time activation<br>\n🔐 Activates via Online or Phone<br>\n❌ Not linked to your Microsoft account<br>\n⚠️ Cannot be reused if uninstalled<br>\n✔️ Best for users who won’t reinstall or switch devices<br>\n\n<br>◉ BIND Key<br>\n ✅ Lifetime Validity – Reusable and transferable<br>\n🔗 Permanently linked to your Microsoft account<br>\n🔄 Auto-activates on any PC when logged into the same account<br>\n✔️ Ideal for users who may reinstall or change PCs<br>\n\n<br><h3>🌍 Key Features:</h3>\n✅ One-time purchase – No subscription or renewal required<br>\n✅ 100% Genuine – Legally sourced from Microsoft-authorized partners<br>\n✅ Global License – Can be used in any country<br>\n✅ Multilingual support – Choose your preferred language<br>\n✅ Official Microsoft updates – Stay up to date<br>\n✅ Supports GPT/AI plugins – Enhance productivity<br>\n✅ Rated 4.9⭐ by real customers (Google, Trustpilot)<br>\n\n<br><h3>⚠️ Important Notes:</h3>\n==> For Windows OS only<br>\n==> Retail BIND Key cannot be transferred between Microsoft accounts<br>\n==> Please keep your Microsoft account credentials safe – keys cannot be recovered once lost<br>\n",
        "image": "/img_content/office24proplus.png",
        "icon": "📦",
        "color": "#D83B01",
        "gradient": "linear-gradient(135deg, #D83B01, #FF8C00)"
    },
    {
        "id": "1774333684043",
        "name": "Windows 10 HOME",
        "category": "windows",
        "badge": "sale",
        "price": 400,
        "originalPrice": 12800,
        "desc": "Windows 10 HOME",
        "longDesc": "💠Original Retail License KEY.<br>\n\n💠1 PC 1 Key Lifetime Activation.<br>\n\n💠Digital License & Online Activation.<br>\n\n💠Auto Activation after Windows Setup.<br>\n\n💠License Will Be Linked With Your Microsoft Account.<br>\n\n💠Have to Activate by 24 hrs after Delivery.<br>\n\n💠Instant Delivery.<br>\n\n<br><h2>Delivery Information</h2>\n\n✅ Delivery time: within 5 minutes to 1 hour<br>\n✅ Instant delivery via WhatsApp<br>\n✅ Email delivery is Optional<br>\n✅ Please ensure your WhatsApp number is correct at checkout<br>\n\n<br><h2>Activation Steps</h2>\n1. Go to Settings → Activation → Change Product Key<br>\n2. Enter the license key received on WhatsApp<br>\nClick Next → Activate<br>\n3. Your Windows 10 Home will be permanently activated.<br>",
        "image": "/img_content/win10home.png",
        "icon": "📦",
        "color": "#6C63FF",
        "gradient": "linear-gradient(135deg, #6C63FF, #00D4AA)"
    },
    {
        "id": "1774402685893",
        "name": "Microsoft Office 2024 Home & Business –<br> Lifetime BIND Key - Mac OS ",
        "category": "office",
        "badge": "new",
        "price": 9500,
        "originalPrice": 21500,
        "desc": "• Microsoft Office 2024 Home and Business License Key.<br>\n• Retail Bind Key (Sync with microsoft account).<br>\n• MacOS.<br>\n• 1 Device key.<br>",
        "longDesc": "Activate Microsoft Office 2021 Home & Business (Mac) for life with a genuine BIND Key—permanently linked to your Microsoft account. This license includes the full Office suite for macOS, with online activation and all official updates.<br>\n\nPerfect for MacBook users who want a one-time purchase instead of Office 365 subscriptions.<br>\n\n<br><h3>Included Office Applications:</h3>\n◼ Word – Create polished documents<br>\n\n◼ Excel – Analyze data and use advanced formulas<br>\n\n◼ PowerPoint – Build modern presentations<br>\n\n◼ Outlook – Manage email and calendars<br>\n\n◼ OneNote – Capture and organize notes<br>\n\n💡 Access & Publisher are Windows-only apps and won’t be available on Mac.<br>\n\n<br><h3>Key Features:</h3>\n✅ Lifetime License for Mac OS<br>\n\n✅ BIND Key: Linked to Your Microsoft Account<br>\n\n✅ Online Activation – No phone call needed<br>\n\n✅ Transferable to New Mac (1 device at a time)<br>\n\n✅ Compatible with macOS Monterey, Ventura & above<br>\n\n✅ All Official Microsoft Updates<br>\n\n✅ Region: Global<br>\n\n✅ Instant Email Delivery<br>\n\n✅ 24/7 Live Chat Support<br>\n\n✅ Multilingual<br>\n\n✅ 100% Money-Back Guarantee<br>\n\n<br><h3>System Compatibility Note:</h3>\nOnly compatible with MacBooks 2020 or newer.<br>\nOlder devices may face performance or compatibility issues.<br>\n\n<br><h3>Activation Steps:</h3>\n1. Uninstall any existing Office setup from your Mac<br>\n\n2. Go to setup.office.com<br>\n\n3. Sign in or create a Microsoft account<br>\n\n4. Redeem your key under “Get Started”<br>\n\n5. Go to your Microsoft account Services & Subscriptions<br>\n\n6. Download and install Office<br>\n\n7. After install, log into Word with the same account used during redemption. Done!<br>\n\nThe license is permanently linked to your account—safe and secure.<br>\n\n<br><h3>Important Notes:</h3>\n==>This key is not recoverable if you lose access to your Microsoft account<br>\n\n==>Not compatible with Windows PCs<br>",
        "image": "/img_content/office24hb.png",
        "icon": "📦",
        "color": "#6C63FF",
        "gradient": "linear-gradient(135deg, #6C63FF, #00D4AA)"
    },
    {
        "id": "1774405426270",
        "name": "Microsoft Office 2021 Pro Plus Non Sync",
        "category": "office",
        "badge": "hot",
        "price": 500,
        "originalPrice": 18500,
        "desc": "Microsoft Office 2021 Pro Plus License Key<br>\n◼ Lifetime Validity – One-Time Setup<br>\n◼ For Windows 7/8/10/11 (32 & 64-bit)<br>\n◼ Includes Word, Excel, PowerPoint, Outlook & more<br>\n",
        "longDesc": "🔰 Microsoft Office 2021 Pro Plus – Lifetime Genuine License<br>\nUnlock the full potential of Microsoft Office 2021 with a 100% genuine license key, available in two options — Retail Key and Retail BIND Key. Perfect for professionals, students, and business users looking for a reliable and permanent Office solution.<br>\n\n<br><h3>Office Pro Plus 2021 Non Sync(Windows Version)</h3>\n\n🔰 No Email Synchronization: ইমেইল দিয়ে লগইন করা যাবে, তবে সিঙ্কোনাইজেশন হবে না।<br>\n🔰 One-Time Activation: এই লাইসেন্স কেবল একবারই অ্যাক্টিভ করা যাবে।<br>\n🔰 No System Format: উইন্ডোজ ফরম্যাট করা যাবে না।<br>\n🔰 No Software Uninstallation: অফিস সফটওয়্যার আনইন্সটল করা যাবে না।<br>\n🔰 No Hardware Changes: হার্ডওয়ার পরিবর্তন করতে পারবেন না।<br>\n🔰 Single Use Only: এই লাইসেন্স পুনরায় ব্যবহারযোগ্য নয় বা অন্য কোনো পিসিতে ট্রান্সফার করা যাবে না।<br>\n🔰 Inactive After PC Issues: পিসি নষ্ট হওয়া বা আপগ্রেড করলে লাইসেন্স কী কাজ করবে না।<br>\n🔰এছাড়াও যে কোনো কারণে এটা ইনএক্টিভ হয়ে যেতে পারে যেহেতু Non Sync.<br>\n📌সেজন্য এটাকে লাইফ টাইম না বলাই ভালো কারণ উপরের কাজগুলো আপনার করা লাগতেই পারে।<br>\n\n📌 Have to Activate by 24 hrs after Delivery.<br>\n\n📢Mail Delivery (10 Minutes to 2 HRS)<br>\n\n<br><h3>📦 What’s Included:</h3>\n✔ Microsoft Word<br>\n✔ Microsoft Excel<br>\n✔ Microsoft PowerPoint<br>\n✔ Microsoft Outlook<br>\n✔ Microsoft Access<br>\n✔ Microsoft OneNote<br>\n✔ Skype for Business<br>\n✔ And other essential Office apps<br>\n<br><h3>🔑 License Options:</h3><br>\n◉ Retail Key<br>\n ✅ Lifetime Validity – One-time activation<br>\n🔐 Activates via Online or Phone<br>\n❌ Not linked to your Microsoft account<br>\n⚠️ Cannot be reused if uninstalled<br>\n✔️ Best for users who won’t reinstall or switch devices<br>\n\n<br>◉ BIND Key<br>\n ✅ Lifetime Validity – Reusable and transferable<br>\n🔗 Permanently linked to your Microsoft account<br>\n🔄 Auto-activates on any PC when logged into the same account<br>\n✔️ Ideal for users who may reinstall or change PCs<br>\n\n<br><h3>🌍 Key Features:</h3>\n✅ One-time purchase – No subscription or renewal required<br>\n✅ 100% Genuine – Legally sourced from Microsoft-authorized partners<br>\n✅ Global License – Can be used in any country<br>\n✅ Multilingual support – Choose your preferred language<br>\n✅ Official Microsoft updates – Stay up to date<br>\n✅ Supports GPT/AI plugins – Enhance productivity<br>\n✅ Rated 4.9⭐ by real customers (Google, Trustpilot)<br>\n\n<br><h3>⚠️ Important Notes:</h3>\n==> For Windows OS only<br>\n==> Retail BIND Key cannot be transferred between Microsoft accounts<br>\n==> Please keep your Microsoft account credentials safe – keys cannot be recovered once lost<br>\n",
        "image": "/img_content/office21proplus.png",
        "icon": "📦",
        "color": "#6C63FF",
        "gradient": "linear-gradient(135deg, #6C63FF, #00D4AA)"
    },
    {
        "id": "1774419434576",
        "name": "Microsoft Office 2019 Pro Plus Non Sync",
        "category": "office",
        "badge": "sale",
        "price": 450,
        "originalPrice": 13500,
        "desc": "\nMicrosoft Office 2019 Pro Plus License Key<br>\n◼ Lifetime Validity – One-Time Setup<br>\n◼ For Windows 7/8/10/11 (32 & 64-bit)<br>\n◼ Includes Word, Excel, PowerPoint, Outlook & more<br>",
        "longDesc": "🔰 Microsoft Office 2019 Pro Plus – Lifetime Genuine License<br>\nUnlock the full potential of Microsoft Office 2019 with a 100% genuine license key, available in two options — Retail Key and Retail BIND Key. Perfect for professionals, students, and business users looking for a reliable and permanent Office solution.<br>\n\n<br><h3>Office Pro Plus 2019 Non Sync(Windows Version)</h3>\n\n🔰 No Email Synchronization: ইমেইল দিয়ে লগইন করা যাবে, তবে সিঙ্কোনাইজেশন হবে না।<br>\n🔰 One-Time Activation: এই লাইসেন্স কেবল একবারই অ্যাক্টিভ করা যাবে।<br>\n🔰 No System Format: উইন্ডোজ ফরম্যাট করা যাবে না।<br>\n🔰 No Software Uninstallation: অফিস সফটওয়্যার আনইন্সটল করা যাবে না।<br>\n🔰 No Hardware Changes: হার্ডওয়ার পরিবর্তন করতে পারবেন না।<br>\n🔰 Single Use Only: এই লাইসেন্স পুনরায় ব্যবহারযোগ্য নয় বা অন্য কোনো পিসিতে ট্রান্সফার করা যাবে না।<br>\n🔰 Inactive After PC Issues: পিসি নষ্ট হওয়া বা আপগ্রেড করলে লাইসেন্স কী কাজ করবে না।<br>\n🔰এছাড়াও যে কোনো কারণে এটা ইনএক্টিভ হয়ে যেতে পারে যেহেতু Non Sync.<br>\n📌সেজন্য এটাকে লাইফ টাইম না বলাই ভালো কারণ উপরের কাজগুলো আপনার করা লাগতেই পারে।<br>\n\n📌 Have to Activate by 24 hrs after Delivery.<br>\n\n📢Mail Delivery (10 Minutes to 2 HRS)<br>\n\n<br><h3>📦 What’s Included:</h3>\n✔ Microsoft Word<br>\n✔ Microsoft Excel<br>\n✔ Microsoft PowerPoint<br>\n✔ Microsoft Outlook<br>\n✔ Microsoft Access<br>\n✔ Microsoft OneNote<br>\n✔ Skype for Business<br>\n✔ And other essential Office apps<br>\n<br><h3>🔑 License Options:</h3><br>\n◉ Retail Key<br>\n ✅ Lifetime Validity – One-time activation<br>\n🔐 Activates via Online or Phone<br>\n❌ Not linked to your Microsoft account<br>\n⚠️ Cannot be reused if uninstalled<br>\n✔️ Best for users who won’t reinstall or switch devices<br>\n\n<br>◉ BIND Key<br>\n ✅ Lifetime Validity – Reusable and transferable<br>\n🔗 Permanently linked to your Microsoft account<br>\n🔄 Auto-activates on any PC when logged into the same account<br>\n✔️ Ideal for users who may reinstall or change PCs<br>\n\n<br><h3>🌍 Key Features:</h3>\n✅ One-time purchase – No subscription or renewal required<br>\n✅ 100% Genuine – Legally sourced from Microsoft-authorized partners<br>\n✅ Global License – Can be used in any country<br>\n✅ Multilingual support – Choose your preferred language<br>\n✅ Official Microsoft updates – Stay up to date<br>\n✅ Supports GPT/AI plugins – Enhance productivity<br>\n✅ Rated 4.9⭐ by real customers (Google, Trustpilot)<br>\n\n<br><h3>⚠️ Important Notes:</h3>\n==> For Windows OS only<br>\n==> Retail BIND Key cannot be transferred between Microsoft accounts<br>\n==> Please keep your Microsoft account credentials safe – keys cannot be recovered once lost<br>\n",
        "image": "/img_content/office19proplus.png",
        "icon": "📦",
        "color": "#6C63FF",
        "gradient": "linear-gradient(135deg, #6C63FF, #00D4AA)"
    },
    {
        "id": "1774442079989",
        "name": "Microsoft Office 2019 Home & Business –<br> Lifetime BIND Key ",
        "category": "office",
        "badge": "sale",
        "price": 3550,
        "originalPrice": 17500,
        "desc": "• Microsoft Office 2019 Home and Business License Key.<br>\n• Retail Bind Key (Sync with microsoft account).<br>\n• Windows/MacOS.<br>\n• 1 Device key.<br>",
        "longDesc": "Activate Microsoft Office 2019 Home & Business for life with a genuine BIND Key—permanently linked to your Microsoft account. This license includes the full Office suite for macOS, with online activation and all official updates.<br>\n\nPerfect for MacBook/Windows users who want a one-time purchase instead of Office 365 subscriptions.<br>\n\n<br><h3>Included Office Applications:</h3>\n◼ Word – Create polished documents<br>\n\n◼ Excel – Analyze data and use advanced formulas<br>\n\n◼ PowerPoint – Build modern presentations<br>\n\n◼ Outlook – Manage email and calendars<br>\n\n◼ OneNote – Capture and organize notes<br>\n\n💡 Access & Publisher are Windows-only apps and won’t be available on Mac.<br>\n\n<br><h3>Key Features:</h3>\n✅ Lifetime License for Mac OS<br>\n\n✅ BIND Key: Linked to Your Microsoft Account<br>\n\n✅ Online Activation – No phone call needed<br>\n\n✅ Transferable to New Mac (1 device at a time)<br>\n\n✅ Compatible with macOS Monterey, Ventura & above<br>\n\n✅ All Official Microsoft Updates<br>\n\n✅ Region: Global<br>\n\n✅ Instant Email Delivery<br>\n\n✅ 24/7 Live Chat Support<br>\n\n✅ Multilingual<br>\n\n✅ 100% Money-Back Guarantee<br>\n\n<br><h3>System Compatibility Note:</h3>\nOnly compatible with MacBooks 2015 or newer.<br>\nOlder devices may face performance or compatibility issues.<br>\n\n<br><h3>Activation Steps:</h3>\n1. Uninstall any existing Office setup from your Mac<br>\n\n2. Go to setup.office.com<br>\n\n3. Sign in or create a Microsoft account<br>\n\n4. Redeem your key under “Get Started”<br>\n\n5. Go to your Microsoft account Services & Subscriptions<br>\n\n6. Download and install Office<br>\n\n7. After install, log into Word with the same account used during redemption. Done!<br>\n\nThe license is permanently linked to your account—safe and secure.<br>\n\n<br><h3>Important Notes:</h3>\n==>This key is not recoverable if you lose access to your Microsoft account<br>\n\n==> compatible with Windows/ MacOs PCs<br>",
        "image": "/img_content/office19proplus.png",
        "icon": "📦",
        "color": "#6C63FF",
        "gradient": "linear-gradient(135deg, #6C63FF, #00D4AA)"
    },
    {
        "id": "1774442963518",
        "name": "Microsoft Office 2016 Pro Plus Non Sync",
        "category": "office",
        "badge": "sale",
        "price": 400,
        "originalPrice": 11500,
        "desc": "Microsoft Office 2016 Pro Plus License Key<br>\n◼ For Windows 7/8/10/11 (32 & 64-bit)<br>\n🔰 Non Sync with your email.<br>\n🔰 1 time Activation.<br>\n🔰 You can not erase key from your system.<br>\n🔰 Can not Format Windows<br>\n🔰 Can not Uninstall Office<br>\n🔰 Can not Change Hardware<br>",
        "longDesc": "🔰 Microsoft Office 2016 Pro Plus – Lifetime Genuine License<br>\nUnlock the full potential of Microsoft Office 2016 with a 100% genuine license key, available in two options — Retail Key and Retail BIND Key. Perfect for professionals, students, and business users looking for a reliable and permanent Office solution.<br>\n\n<br><h3>Office Pro Plus 2016 Non Sync(Windows Version)</h3>\n\n🔰 No Email Synchronization: ইমেইল দিয়ে লগইন করা যাবে, তবে সিঙ্কোনাইজেশন হবে না।<br>\n🔰 One-Time Activation: এই লাইসেন্স কেবল একবারই অ্যাক্টিভ করা যাবে।<br>\n🔰 No System Format: উইন্ডোজ ফরম্যাট করা যাবে না।<br>\n🔰 No Software Uninstallation: অফিস সফটওয়্যার আনইন্সটল করা যাবে না।<br>\n🔰 No Hardware Changes: হার্ডওয়ার পরিবর্তন করতে পারবেন না।<br>\n🔰 Single Use Only: এই লাইসেন্স পুনরায় ব্যবহারযোগ্য নয় বা অন্য কোনো পিসিতে ট্রান্সফার করা যাবে না।<br>\n🔰 Inactive After PC Issues: পিসি নষ্ট হওয়া বা আপগ্রেড করলে লাইসেন্স কী কাজ করবে না।<br>\n🔰এছাড়াও যে কোনো কারণে এটা ইনএক্টিভ হয়ে যেতে পারে যেহেতু Non Sync.<br>\n📌সেজন্য এটাকে লাইফ টাইম না বলাই ভালো কারণ উপরের কাজগুলো আপনার করা লাগতেই পারে।<br>\n\n📌 Have to Activate by 24 hrs after Delivery.<br>\n\n📢Mail Delivery (10 Minutes to 2 HRS)<br>\n\n<br><h3>📦 What’s Included:</h3>\n✔ Microsoft Word<br>\n✔ Microsoft Excel<br>\n✔ Microsoft PowerPoint<br>\n✔ Microsoft Outlook<br>\n✔ Microsoft Access<br>\n✔ Microsoft OneNote<br>\n✔ Skype for Business<br>\n✔ And other essential Office apps<br>\n<br><h3>🔑 License Options:</h3><br>\n◉ Retail Key<br>\n ✅ Lifetime Validity – One-time activation<br>\n🔐 Activates via Online or Phone<br>\n❌ Not linked to your Microsoft account<br>\n⚠️ Cannot be reused if uninstalled<br>\n✔️ Best for users who won’t reinstall or switch devices<br>\n\n<br>◉ BIND Key<br>\n ✅ Lifetime Validity – Reusable and transferable<br>\n🔗 Permanently linked to your Microsoft account<br>\n🔄 Auto-activates on any PC when logged into the same account<br>\n✔️ Ideal for users who may reinstall or change PCs<br>\n\n<br><h3>🌍 Key Features:</h3>\n✅ One-time purchase – No subscription or renewal required<br>\n✅ 100% Genuine – Legally sourced from Microsoft-authorized partners<br>\n✅ Global License – Can be used in any country<br>\n✅ Multilingual support – Choose your preferred language<br>\n✅ Official Microsoft updates – Stay up to date<br>\n✅ Supports GPT/AI plugins – Enhance productivity<br>\n✅ Rated 4.9⭐ by real customers (Google, Trustpilot)<br>\n\n<br><h3>⚠️ Important Notes:</h3>\n==> For Windows OS only<br>\n==> Retail BIND Key cannot be transferred between Microsoft accounts<br>\n==> Please keep your Microsoft account credentials safe – keys cannot be recovered once lost<br>\n",
        "image": "/img_content/office16proplus.png",
        "icon": "📦",
        "color": "#6C63FF",
        "gradient": "linear-gradient(135deg, #6C63FF, #00D4AA)"
    },
    {
        "id": "1774444539183",
        "name": "Microsoft Office 2021 Home & Business –<br> Lifetime BIND Key ",
        "category": "office",
        "badge": "hot",
        "price": 3850,
        "originalPrice": 16500,
        "desc": "• Microsoft Office 2021 Home and Business License Key.<br>\n• Retail Bind Key (Sync with microsoft account).<br>\n• Windows/MacOS.<br>\n• 1 Device key.<br>",
        "longDesc": "Activate Microsoft Office 2021 Home & Business for life with a genuine BIND Key—permanently linked to your Microsoft account. This license includes the full Office suite for macOS, with online activation and all official updates.<br>\n\nPerfect for MacBook/Windows users who want a one-time purchase instead of Office 365 subscriptions.<br>\n\n<br><h3>Included Office Applications:</h3>\n◼ Word – Create polished documents<br>\n\n◼ Excel – Analyze data and use advanced formulas<br>\n\n◼ PowerPoint – Build modern presentations<br>\n\n◼ Outlook – Manage email and calendars<br>\n\n◼ OneNote – Capture and organize notes<br>\n\n💡 Access & Publisher are Windows-only apps and won’t be available on Mac.<br>\n\n<br><h3>Key Features:</h3>\n✅ Lifetime License for Mac OS<br>\n\n✅ BIND Key: Linked to Your Microsoft Account<br>\n\n✅ Online Activation – No phone call needed<br>\n\n✅ Transferable to New Mac (1 device at a time)<br>\n\n✅ Compatible with macOS Monterey, Ventura & above<br>\n\n✅ All Official Microsoft Updates<br>\n\n✅ Region: Global<br>\n\n✅ Instant Email Delivery<br>\n\n✅ 24/7 Live Chat Support<br>\n\n✅ Multilingual<br>\n\n✅ 100% Money-Back Guarantee<br>\n\n<br><h3>System Compatibility Note:</h3>\nOnly compatible with MacBooks 2015 or newer.<br>\nOlder devices may face performance or compatibility issues.<br>\n\n<br><h3>Activation Steps:</h3>\n1. Uninstall any existing Office setup from your Mac<br>\n\n2. Go to setup.office.com<br>\n\n3. Sign in or create a Microsoft account<br>\n\n4. Redeem your key under “Get Started”<br>\n\n5. Go to your Microsoft account Services & Subscriptions<br>\n\n6. Download and install Office<br>\n\n7. After install, log into Word with the same account used during redemption. Done!<br>\n\nThe license is permanently linked to your account—safe and secure.<br>\n\n<br><h3>Important Notes:</h3>\n==>This key is not recoverable if you lose access to your Microsoft account<br>\n\n==> compatible with Windows/ MacOs PCs<br>",
        "image": "/img_content/o21hb.png",
        "icon": "📦",
        "color": "#6C63FF",
        "gradient": "linear-gradient(135deg, #6C63FF, #00D4AA)"
    },
    {
        "id": "1774445303611",
        "name": "Microsoft Office 2016 Home & Business – Lifetime BIND (Email-Linked Activation)",
        "category": "office",
        "badge": "sale",
        "price": 2950,
        "originalPrice": 11500,
        "desc": "• Microsoft Office 2016 Home and Business License Key.<br>\n• Retail Bind Key (Sync with microsoft account).<br>\n• Windows/MacOS.<br>\n• 1 Device key.<br>",
        "longDesc": "Activate Microsoft Office 2016 Home & Business for life with a genuine BIND Key—permanently linked to your Microsoft account. This license includes the full Office suite for macOS, with online activation and all official updates.<br>\n\nPerfect for MacBook/Windows users who want a one-time purchase instead of Office 365 subscriptions.<br>\n\n<br><h3>Included Office Applications:</h3>\n◼ Word – Create polished documents<br>\n\n◼ Excel – Analyze data and use advanced formulas<br>\n\n◼ PowerPoint – Build modern presentations<br>\n\n◼ Outlook – Manage email and calendars<br>\n\n◼ OneNote – Capture and organize notes<br>\n\n💡 Access & Publisher are Windows-only apps and won’t be available on Mac.<br>\n\n<br><h3>Key Features:</h3>\n✅ Lifetime License for Mac OS<br>\n\n✅ BIND Key: Linked to Your Microsoft Account<br>\n\n✅ Online Activation – No phone call needed<br>\n\n✅ Transferable to New Mac (1 device at a time)<br>\n\n✅ Compatible with macOS Monterey, Ventura & above<br>\n\n✅ All Official Microsoft Updates<br>\n\n✅ Region: Global<br>\n\n✅ Instant Email Delivery<br>\n\n✅ 24/7 Live Chat Support<br>\n\n✅ Multilingual<br>\n\n✅ 100% Money-Back Guarantee<br>\n\n<br><h3>System Compatibility Note:</h3>\nOnly compatible with MacBooks 2015 or newer.<br>\nOlder devices may face performance or compatibility issues.<br>\n\n<br><h3>Activation Steps:</h3>\n1. Uninstall any existing Office setup from your Mac<br>\n\n2. Go to setup.office.com<br>\n\n3. Sign in or create a Microsoft account<br>\n\n4. Redeem your key under “Get Started”<br>\n\n5. Go to your Microsoft account Services & Subscriptions<br>\n\n6. Download and install Office<br>\n\n7. After install, log into Word with the same account used during redemption. Done!<br>\n\nThe license is permanently linked to your account—safe and secure.<br>\n\n<br><h3>Important Notes:</h3>\n==>This key is not recoverable if you lose access to your Microsoft account<br>\n\n==> compatible with Windows/ MacOs PCs<br>",
        "image": "/img_content/office16hb.png",
        "icon": "📦",
        "color": "#6C63FF",
        "gradient": "linear-gradient(135deg, #6C63FF, #00D4AA)"
    },
    {
        "id": "1774508717023",
        "name": "Microsoft Office 2013 Pro Plus Non Sync",
        "category": "office",
        "badge": "",
        "price": 400,
        "originalPrice": 9500,
        "desc": "Microsoft Office 2013 Pro Plus License Key<br>\n◼ For Windows 7/8/10/11 (32 & 64-bit)<br>\n🔰 Non Sync with your email.<br>\n🔰 1 time Activation.<br>\n🔰 You can not erase key from your system.<br>\n🔰 Can not Format Windows<br>\n🔰 Can not Uninstall Office<br>\n🔰 Can not Change Hardware<br>",
        "longDesc": "🔰 Microsoft Office 2013 Pro Plus – Lifetime Genuine License<br>\nUnlock the full potential of Microsoft Office 2013 with a 100% genuine license key, available in two options — Retail Key and Retail BIND Key. Perfect for professionals, students, and business users looking for a reliable and permanent Office solution.<br>\n\n<br><h3>Office Pro Plus 2013 Non Sync(Windows Version)</h3>\n\n🔰 No Email Synchronization: ইমেইল দিয়ে লগইন করা যাবে, তবে সিঙ্কোনাইজেশন হবে না।<br>\n🔰 One-Time Activation: এই লাইসেন্স কেবল একবারই অ্যাক্টিভ করা যাবে।<br>\n🔰 No System Format: উইন্ডোজ ফরম্যাট করা যাবে না।<br>\n🔰 No Software Uninstallation: অফিস সফটওয়্যার আনইন্সটল করা যাবে না।<br>\n🔰 No Hardware Changes: হার্ডওয়ার পরিবর্তন করতে পারবেন না।<br>\n🔰 Single Use Only: এই লাইসেন্স পুনরায় ব্যবহারযোগ্য নয় বা অন্য কোনো পিসিতে ট্রান্সফার করা যাবে না।<br>\n🔰 Inactive After PC Issues: পিসি নষ্ট হওয়া বা আপগ্রেড করলে লাইসেন্স কী কাজ করবে না।<br>\n🔰এছাড়াও যে কোনো কারণে এটা ইনএক্টিভ হয়ে যেতে পারে যেহেতু Non Sync.<br>\n📌সেজন্য এটাকে লাইফ টাইম না বলাই ভালো কারণ উপরের কাজগুলো আপনার করা লাগতেই পারে।<br>\n\n📌 Have to Activate by 24 hrs after Delivery.<br>\n\n📢Mail Delivery (10 Minutes to 2 HRS)<br>\n\n<br><h3>📦 What’s Included:</h3>\n✔ Microsoft Word<br>\n✔ Microsoft Excel<br>\n✔ Microsoft PowerPoint<br>\n✔ Microsoft Outlook<br>\n✔ Microsoft Access<br>\n✔ Microsoft OneNote<br>\n✔ Skype for Business<br>\n✔ And other essential Office apps<br>\n<br><h3>🔑 License Options:</h3><br>\n◉ Retail Key<br>\n ✅ Lifetime Validity – One-time activation<br>\n🔐 Activates via Online or Phone<br>\n❌ Not linked to your Microsoft account<br>\n⚠️ Cannot be reused if uninstalled<br>\n✔️ Best for users who won’t reinstall or switch devices<br>\n\n<br>◉ BIND Key<br>\n ✅ Lifetime Validity – Reusable and transferable<br>\n🔗 Permanently linked to your Microsoft account<br>\n🔄 Auto-activates on any PC when logged into the same account<br>\n✔️ Ideal for users who may reinstall or change PCs<br>\n\n<br><h3>🌍 Key Features:</h3>\n✅ One-time purchase – No subscription or renewal required<br>\n✅ 100% Genuine – Legally sourced from Microsoft-authorized partners<br>\n✅ Global License – Can be used in any country<br>\n✅ Multilingual support – Choose your preferred language<br>\n✅ Official Microsoft updates – Stay up to date<br>\n✅ Supports GPT/AI plugins – Enhance productivity<br>\n✅ Rated 4.9⭐ by real customers (Google, Trustpilot)<br>\n\n<br><h3>⚠️ Important Notes:</h3>\n==> For Windows OS only<br>\n==> Retail BIND Key cannot be transferred between Microsoft accounts<br>\n==> Please keep your Microsoft account credentials safe – keys cannot be recovered once lost<br>\n",
        "image": "/img_content/o13pp.png",
        "icon": "📦",
        "color": "#6C63FF",
        "gradient": "linear-gradient(135deg, #6C63FF, #00D4AA)"
    },
    {
        "id": "1774510199259",
        "name": "Microsoft Office 365 <br> Account And Password(Changable)",
        "category": "365",
        "badge": "hot",
        "price": 400,
        "originalPrice": 7500,
        "desc": "\n🔹 Ready-Made Account<br>\n✅ Pre-activated account with login details<br>\n✅ Instant access, password changeable<br>\n✅ 1 year subscription (non-renewable)<br>\n✅ Replacement provided if any issue<br>\n✅  Available for Windows + Mac Os<br>",
        "longDesc": "<h3>🔹Ready-Made Microsoft 365 Account\nPre-Activated </h3> <br>\n\nPerfect for users who want instant access without any setup hassle.<br>\n\n✅ Pre-activated account ready to use immediately<br>\n✅ Complete login credentials provided upon delivery<br>\n✅ Full access to all Microsoft 365 apps and features<br>\n✅ OneDrive cloud storage included<br>\n✅ Multi-device compatibility (PC, Laptop, Mobile, Tablet)<br>\n✅ Password can be changed after delivery for security<br>\n✅ Subscription Duration: 1 Year (Yearly subscription only)<br>\n✅ Renewal Policy: Renewal on the same account is not available. After expiry, a new account will be provided<br>\n✅ Guarantee: Replacement account provided if any System issue occurs<br>\n✅ Ideal For: Users who need quick access and don’t require long-term account continuity <br>\n\n<br><h3>📦 What’s Included:</h3>\n✔ Microsoft Word<br>\n✔ Microsoft Excel<br>\n✔ Microsoft PowerPoint<br>\n✔ Microsoft Outlook<br>\n✔ Microsoft Access<br>\n✔ Microsoft OneNote<br>\n\n<br><h3>⏰Delivery through WhatsApp</h3>\n==> Once your order is processed, it will be delivered via WhatsApp. <br>\n==> Please avoid requesting urgent delivery under any circumstances. Standard delivery time is 10 mins - 3 hours (within office hours).",
        "image": "/img_content/o365.png",
        "icon": "📦",
        "color": "#6C63FF",
        "gradient": "linear-gradient(135deg, #6C63FF, #00D4AA)"
    },
    {
        "id": "1774510988677",
        "name": "Microsoft Office 365 Personal <br> With Own Mail ",
        "category": "365",
        "badge": "new",
        "price": 1750,
        "originalPrice": 12500,
        "desc": "❄️ Full Access to Premium Microsoft Apps<br>\n❄️ Multi-Device Support<br>\n❄️ Offline Access<br>\n❄️ Advanced Security and Privacy<br>\n❄️ Exclusive Features for Subscribers<br>\n❄️ 1 TB OneDrive cloud storage<br>\n❄️ Available for Windows + Mac Os<br>\n",
        "longDesc": "<h3>Personal Microsoft 365 Account</h3><br>\n\n\n✅  Best for users who want full ownership and control of their Microsoft account.<br>\n\n✅  Activated directly on your personal email address by Invitation<br>\n\n✅  Complete account ownership and control<br>\n\n✅  1 TB OneDrive cloud storage<br>\n\n✅  Full access to all Microsoft 365 apps and features<br>\n \n✅ Multi-device compatibility (PC, Laptop, Mobile, Tablet)<br>\n\n✅ Subscription Duration: 1 Year (Yearly subscription only)<br>\n\n✅ Renewal Available: Yes, yearly renewal on the same account<br>\n\n✅ Ideal For: Users who need continuous service and want to maintain their account long-term<br>\n\n<br><h3>📦 What’s Included:</h3>\n✔ Microsoft Word<br>\n✔ Microsoft Excel<br>\n✔ Microsoft PowerPoint<br>\n✔ Microsoft Outlook<br>\n✔ Microsoft Access<br>\n✔ Microsoft OneNote<br>\n\n<br><h3>⏰Delivery through WhatsApp</h3>\n==> Once your order is processed, it will be delivered via WhatsApp. <br>\n==> Please avoid requesting urgent delivery under any circumstances. Standard delivery time is 10 mins - 3 hours (within office hours).",
        "image": "/img_content/op365.png",
        "icon": "📦",
        "color": "#6C63FF",
        "gradient": "linear-gradient(135deg, #6C63FF, #00D4AA)"
    },
    {
        "id": "1774512428558",
        "name": "Adobe Creative Cloud Subscription",
        "category": "adobe",
        "badge": "",
        "price": 2950,
        "originalPrice": 6500,
        "desc": "❄️Adobe Creative Cloud Subscription<br>\n\n\n✅ No Down Accounts | 100% Stable & Secure Access<br>\n\n✅ Official Adobe Enterprise subscription activated on your own account.<br>\n\n\n🎯 Included Features:<br>\n\n\n✅ Secure and legally obtained subscription<br>\n\n✅ Flexible plans: 1/3/6/12 Months <br>\n\n✅ Works on 2 devices simultaneously (PC, Mac, Mobile)<br>\n\n✅ All official Adobe apps with smooth, uninterrupted performance<br>\n\n✅ 85 GB Adobe Cloud Storage<br>\n\n✅ 4000 monthly generative credits (Generative Fill & AI features)\n",
        "longDesc": "<h1>Adobe Creative Cloud All Apps – Enterprise (30 Days Only)</h1>\n        <p>Get full access to Adobe’s complete creative suite with our Enterprise plan – a premium 30-day subscription that unlocks every Adobe application for your professional and creative needs. This authentic Enterprise access provides you with the same tools used by leading companies worldwide, activated directly on your personal Adobe account.</p>\n    </header>\n\n    <hr>\n\n    <section id=\"whats-included\">\n        <h2>What’s Included</h2>\n        <ul>\n            <li><strong>Complete Adobe Creative Cloud suite:</strong> 20+ desktop and mobile apps</li>\n            <li><strong>Core Creative Tools:</strong> Photoshop, Illustrator, Premiere Pro, After Effects, InDesign</li>\n            <li><strong>Production & Web:</strong> Lightroom, Acrobat Pro DC, Adobe XD, Dreamweaver, Animate</li>\n            <li><strong>Audio & Workflow:</strong> Audition, Character Animator, Media Encoder, and more</li>\n            <li><strong>Stock & Assets:</strong> Adobe Stock access for standard assets</li>\n            <li><strong>Storage:</strong> 85 GB of cloud storage space</li>\n            <li><strong>AI Features:</strong> 4000 monthly generative AI credits (Adobe’s native AI only)</li>\n            <li><strong>Multi-Device:</strong> Access on 2 devices simultaneously (PC, Mac, or Mobile)</li>\n            <li><strong>Validity:</strong> 30-day validity period</li>\n        </ul>\n    </section>\n\n    <section id=\"activation-process\">\n        <h2>Activation Process</h2>\n        <p>Our activation process is straightforward and secure:</p>\n        <ol>\n            <li>Provide your Adobe account email address during checkout.</li>\n            <li>Your email is added to our Enterprise admin panel.</li>\n            <li>Adobe sends an official invitation directly to your email.</li>\n            <li>Accept the invitation to activate your 30-day subscription.</li>\n            <li>Start using all Adobe apps immediately after activation.</li>\n        </ol>\n        <blockquote>\n            This process ensures the subscription is linked directly to your Adobe account, giving you complete control and security over your access.\n        </blockquote>\n    </section>",
        "image": "/img_content/acc.png",
        "icon": "📦",
        "color": "#6C63FF",
        "gradient": "linear-gradient(135deg, #6C63FF, #00D4AA)"
    },
    {
        "id": "1774512428559",
        "name": "Adobe Creative Cloud Subscription - 90 Days",
        "category": "adobe",
        "badge": "",
        "price": 5950,
        "originalPrice": 19500,
        "desc": "❄️Adobe Creative Cloud Subscription<br>\n\n\n✅ No Down Accounts | 100% Stable & Secure Access<br>\n\n✅ Official Adobe Enterprise subscription activated on your own account.<br>\n\n\n🎯 Included Features:<br>\n\n\n✅ Secure and legally obtained subscription<br>\n\n✅ Flexible plans: 1/3/6/12 Months <br>\n\n✅ Works on 2 devices simultaneously (PC, Mac, Mobile)<br>\n\n✅ All official Adobe apps with smooth, uninterrupted performance<br>\n\n✅ 85 GB Adobe Cloud Storage<br>\n\n✅ 4000 monthly generative credits (Generative Fill & AI features)\n",
        "longDesc": "<h1>Adobe Creative Cloud All Apps – Enterprise (90 Days Only)</h1>\n        <p>Get full access to Adobe’s complete creative suite with our Enterprise plan – a premium 90-day subscription that unlocks every Adobe application for your professional and creative needs. This authentic Enterprise access provides you with the same tools used by leading companies worldwide, activated directly on your personal Adobe account.</p>\n    </header>\n\n    <hr>\n\n    <section id=\"whats-included\">\n        <h2>What’s Included</h2>\n        <ul>\n            <li><strong>Complete Adobe Creative Cloud suite:</strong> 20+ desktop and mobile apps</li>\n            <li><strong>Core Creative Tools:</strong> Photoshop, Illustrator, Premiere Pro, After Effects, InDesign</li>\n            <li><strong>Production & Web:</strong> Lightroom, Acrobat Pro DC, Adobe XD, Dreamweaver, Animate</li>\n            <li><strong>Audio & Workflow:</strong> Audition, Character Animator, Media Encoder, and more</li>\n            <li><strong>Stock & Assets:</strong> Adobe Stock access for standard assets</li>\n            <li><strong>Storage:</strong> 85 GB of cloud storage space</li>\n            <li><strong>AI Features:</strong> 4000 monthly generative AI credits (Adobe’s native AI only)</li>\n            <li><strong>Multi-Device:</strong> Access on 2 devices simultaneously (PC, Mac, or Mobile)</li>\n            <li><strong>Validity:</strong> 90-day validity period</li>\n        </ul>\n    </section>\n\n    <section id=\"activation-process\">\n        <h2>Activation Process</h2>\n        <p>Our activation process is straightforward and secure:</p>\n        <ol>\n            <li>Provide your Adobe account email address during checkout.</li>\n            <li>Your email is added to our Enterprise admin panel.</li>\n            <li>Adobe sends an official invitation directly to your email.</li>\n            <li>Accept the invitation to activate your 90-day subscription.</li>\n            <li>Start using all Adobe apps immediately after activation.</li>\n        </ol>\n        <blockquote>\n            This process ensures the subscription is linked directly to your Adobe account, giving you complete control and security over your access.\n        </blockquote>\n    </section>",
        "image": "/img_content/acc.png",
        "icon": "📦",
        "color": "#6C63FF",
        "gradient": "linear-gradient(135deg, #6C63FF, #00D4AA)"
    },
    {
        "id": "1774512428560",
        "name": "Adobe Creative Cloud Subscription - 180 Days",
        "category": "adobe",
        "badge": "hot",
        "price": 9950,
        "originalPrice": 39000,
        "desc": "❄️Adobe Creative Cloud Subscription<br>\n\n\n✅ No Down Accounts | 100% Stable & Secure Access<br>\n\n✅ Official Adobe Enterprise subscription activated on your own account.<br>\n\n\n🎯 Included Features:<br>\n\n\n✅ Secure and legally obtained subscription<br>\n\n✅ Flexible plans: 1/3/6/12 Months <br>\n\n✅ Works on 2 devices simultaneously (PC, Mac, Mobile)<br>\n\n✅ All official Adobe apps with smooth, uninterrupted performance<br>\n\n✅ 85 GB Adobe Cloud Storage<br>\n\n✅ 4000 monthly generative credits (Generative Fill & AI features)\n",
        "longDesc": "<h1>Adobe Creative Cloud All Apps – Enterprise (180 Days Only)</h1>\n        <p>Get full access to Adobe’s complete creative suite with our Enterprise plan – a premium 180-day subscription that unlocks every Adobe application for your professional and creative needs. This authentic Enterprise access provides you with the same tools used by leading companies worldwide, activated directly on your personal Adobe account.</p>\n    </header>\n\n    <hr>\n\n    <section id=\"whats-included\">\n        <h2>What’s Included</h2>\n        <ul>\n            <li><strong>Complete Adobe Creative Cloud suite:</strong> 20+ desktop and mobile apps</li>\n            <li><strong>Core Creative Tools:</strong> Photoshop, Illustrator, Premiere Pro, After Effects, InDesign</li>\n            <li><strong>Production & Web:</strong> Lightroom, Acrobat Pro DC, Adobe XD, Dreamweaver, Animate</li>\n            <li><strong>Audio & Workflow:</strong> Audition, Character Animator, Media Encoder, and more</li>\n            <li><strong>Stock & Assets:</strong> Adobe Stock access for standard assets</li>\n            <li><strong>Storage:</strong> 85 GB of cloud storage space</li>\n            <li><strong>AI Features:</strong> 4000 monthly generative AI credits (Adobe’s native AI only)</li>\n            <li><strong>Multi-Device:</strong> Access on 2 devices simultaneously (PC, Mac, or Mobile)</li>\n            <li><strong>Validity:</strong> 180-day validity period</li>\n        </ul>\n    </section>\n\n    <section id=\"activation-process\">\n        <h2>Activation Process</h2>\n        <p>Our activation process is straightforward and secure:</p>\n        <ol>\n            <li>Provide your Adobe account email address during checkout.</li>\n            <li>Your email is added to our Enterprise admin panel.</li>\n            <li>Adobe sends an official invitation directly to your email.</li>\n            <li>Accept the invitation to activate your 180-day subscription.</li>\n            <li>Start using all Adobe apps immediately after activation.</li>\n        </ol>\n        <blockquote>\n            This process ensures the subscription is linked directly to your Adobe account, giving you complete control and security over your access.\n        </blockquote>\n    </section>",
        "image": "/img_content/acc.png",
        "icon": "📦",
        "color": "#6C63FF",
        "gradient": "linear-gradient(135deg, #6C63FF, #00D4AA)"
    },
    {
        "id": "1774512428561",
        "name": "Adobe Creative Cloud Subscription - 365 Days",
        "category": "adobe",
        "badge": "best",
        "price": 14500,
        "originalPrice": 78000,
        "desc": "❄️Adobe Creative Cloud Subscription<br>\n\n\n✅ No Down Accounts | 100% Stable & Secure Access<br>\n\n✅ Official Adobe Enterprise subscription activated on your own account.<br>\n\n\n🎯 Included Features:<br>\n\n\n✅ Secure and legally obtained subscription<br>\n\n✅ Flexible plans: 1/3/6/12 Months <br>\n\n✅ Works on 2 devices simultaneously (PC, Mac, Mobile)<br>\n\n✅ All official Adobe apps with smooth, uninterrupted performance<br>\n\n✅ 85 GB Adobe Cloud Storage<br>\n\n✅ 4000 monthly generative credits (Generative Fill & AI features)\n",
        "longDesc": "<h1>Adobe Creative Cloud All Apps – Enterprise (365 Days Only)</h1>\n        <p>Get full access to Adobe’s complete creative suite with our Enterprise plan – a premium 365-day subscription that unlocks every Adobe application for your professional and creative needs. This authentic Enterprise access provides you with the same tools used by leading companies worldwide, activated directly on your personal Adobe account.</p>\n    </header>\n\n    <hr>\n\n    <section id=\"whats-included\">\n        <h2>What’s Included</h2>\n        <ul>\n            <li><strong>Complete Adobe Creative Cloud suite:</strong> 20+ desktop and mobile apps</li>\n            <li><strong>Core Creative Tools:</strong> Photoshop, Illustrator, Premiere Pro, After Effects, InDesign</li>\n            <li><strong>Production & Web:</strong> Lightroom, Acrobat Pro DC, Adobe XD, Dreamweaver, Animate</li>\n            <li><strong>Audio & Workflow:</strong> Audition, Character Animator, Media Encoder, and more</li>\n            <li><strong>Stock & Assets:</strong> Adobe Stock access for standard assets</li>\n            <li><strong>Storage:</strong> 85 GB of cloud storage space</li>\n            <li><strong>AI Features:</strong> 4000 monthly generative AI credits (Adobe’s native AI only)</li>\n            <li><strong>Multi-Device:</strong> Access on 2 devices simultaneously (PC, Mac, or Mobile)</li>\n            <li><strong>Validity:</strong> 365-day validity period</li>\n        </ul>\n    </section>\n\n    <section id=\"activation-process\">\n        <h2>Activation Process</h2>\n        <p>Our activation process is straightforward and secure:</p>\n        <ol>\n            <li>Provide your Adobe account email address during checkout.</li>\n            <li>Your email is added to our Enterprise admin panel.</li>\n            <li>Adobe sends an official invitation directly to your email.</li>\n            <li>Accept the invitation to activate your 365-day subscription.</li>\n            <li>Start using all Adobe apps immediately after activation.</li>\n        </ol>\n        <blockquote>\n            This process ensures the subscription is linked directly to your Adobe account, giving you complete control and security over your access.\n        </blockquote>\n    </section>",
        "image": "/img_content/acc.png",
        "icon": "📦",
        "color": "#6C63FF",
        "gradient": "linear-gradient(135deg, #6C63FF, #00D4AA)"
    }
];

export const categorySummaries: StoreCategory[] = [
  {
    slug: "office",
    name: "Microsoft Office",
    description: "Office Home and Professional",
    count: products.filter((product) => product.category === "office").length,
    image: "/img_content/office24proplus.png",
    accent: "#D83B01",
  },
  {
    slug: "windows",
    name: "Windows OS",
    description: "Windows 10 and Windows 11",
    count: products.filter((product) => product.category === "windows").length,
    image: "/img_content/win11pro.png",
    accent: "#0078D4",
  },
  {
    slug: "365",
    name: "Microsoft 365",
    description: "Subscription-based Office plans",
    count: products.filter((product) => product.category === "365").length,
    image: "/img_content/O365log.png",
    accent: "#7B5EA7",
  },
  {
    slug: "adobe",
    name: "Creativity & Design",
    description: "Creative Cloud & design subscriptions",
    count: products.filter(
      (product) =>
        product.category === "adobe" ||
        product.category === "creativity-&-design" ||
        product.category === "creativity-and-design"
    ).length,
    image: "/img_content/adobe.png",
    accent: "#FF0000",
  },
];

export const productSummaries: ProductSummary[] = products.map((product) => ({
  id: product.id,
  name: product.name,
  category: product.category,
  badge: product.badge,
  price: product.price,
  originalPrice: product.originalPrice,
  desc: product.desc,
  image: product.image,
  icon: product.icon,
  color: product.color,
  gradient: product.gradient,
}));

type CachedCatalog = {
  data: StoreCatalog;
  timestamp: number;
};

const DB_CATALOG_TIMEOUT_MS = 12000;
const CATALOG_CACHE_TTL_MS = 10 * 60 * 1000;

const globalForCatalog = globalThis as unknown as {
  catalogRetryAfter?: number;
  catalogWarningShownForRetry?: number;
  catalogPromise?: Promise<StoreCatalog>;
  cachedCatalog?: CachedCatalog;
  revalidating?: boolean;
};

const staticCatalog: StoreCatalog = {
  products,
  categories: categorySummaries,
};

function getCatalogRetryAfter() {
  return globalForCatalog.catalogRetryAfter ?? 0;
}

function setCatalogRetryAfter(retryAfter: number) {
  globalForCatalog.catalogRetryAfter = retryAfter;
}

function shouldWarnAboutCatalogFallback(retryAfter: number) {
  if (globalForCatalog.catalogWarningShownForRetry === retryAfter) {
    return false;
  }

  globalForCatalog.catalogWarningShownForRetry = retryAfter;
  return true;
}

function buildCategorySummariesFromProducts(
  categories: StoreCategory[],
  catalogProducts: Product[],
) {
  const productCounts = catalogProducts.reduce<Map<string, number>>(
    (counts, product) => {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
      return counts;
    },
    new Map(),
  );

  return categories
    .map((category) => ({
      ...category,
      count: productCounts.get(category.slug) ?? 0,
    }))
    .filter((category) => category.count > 0);
}

async function loadDatabaseCatalog(): Promise<StoreCatalog | null> {
  if (!process.env.DATABASE_URL || Date.now() < getCatalogRetryAfter()) {
    return null;
  }

  try {
    const fetchPromise = (async () => {
      const { default: prisma } = await import("../lib/prisma");
      return await prisma.$queryRaw<
        {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          image: string | null;
          accent: string | null;
          sortOrder: number;
          products: {
            id: string;
            slug: string;
            name: string;
            badge: string | null;
            price: number;
            originalPrice: number | null;
            shortDescription: string;
            descriptionHtml: string;
            image: string;
            icon: string | null;
            color: string | null;
            gradient: string | null;
            outOfStock: boolean;
            sortOrder: number;
            options: {
              id: string;
              name: string;
              type: string;
              price: number;
              originalPrice: number | null;
              description: string | null;
              sortOrder: number;
            }[];
          }[];
        }[]
      >`
        SELECT
          c.id, c.slug, c.name, c.description, c.image, c.accent, c."sortOrder",
          COALESCE(
            json_agg(
              json_build_object(
                'id', p.id,
                'slug', p.slug,
                'name', p.name,
                'badge', p.badge,
                'price', p.price,
                'originalPrice', p."originalPrice",
                'shortDescription', p."shortDescription",
                'descriptionHtml', p."descriptionHtml",
                'image', p.image,
                'icon', p.icon,
                'color', p.color,
                'gradient', p.gradient,
                'outOfStock', p."outOfStock",
                'sortOrder', p."sortOrder",
                'options', (
                  SELECT COALESCE(
                    json_agg(
                      json_build_object(
                        'id', o.id,
                        'name', o.name,
                        'type', o.type,
                        'price', o.price,
                        'originalPrice', o."originalPrice",
                        'description', o.description,
                        'sortOrder', o."sortOrder"
                      ) ORDER BY o."sortOrder" ASC
                    ), '[]'::json
                  )
                  FROM "ProductOption" o
                  WHERE o."productId" = p.id AND o."isActive" = true
                )
              ) ORDER BY p."sortOrder" ASC, p."createdAt" DESC
            ) FILTER (WHERE p.id IS NOT NULL),
            '[]'::json
          ) AS products
        FROM "Category" c
        LEFT JOIN "Product" p ON p."categoryId" = c.id AND p.status = 'ACTIVE'
        WHERE c."isActive" = true
        GROUP BY c.id
        ORDER BY c."sortOrder" ASC, c."createdAt" ASC, c.name ASC
      `;
    })();

    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        reject(
          new Error(
            `Catalog query exceeded ${DB_CATALOG_TIMEOUT_MS}ms timeout`,
          ),
        );
      }, DB_CATALOG_TIMEOUT_MS);
      if (typeof timer.unref === "function") {
        timer.unref();
      }
    });

    const databaseCategories = await Promise.race([
      fetchPromise,
      timeoutPromise,
    ]);

    const databaseProducts = databaseCategories.flatMap((category) =>
      category.products.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: category.slug,
        badge: product.badge ?? "",
        price: product.price,
        originalPrice: product.originalPrice,
        desc: product.shortDescription,
        longDesc: product.descriptionHtml,
        image: product.image,
        icon: product.icon ?? "💻",
        color: product.color ?? "#38bdf8",
        gradient:
          product.gradient ?? "linear-gradient(135deg, #38bdf8, #6366f1)",
        outOfStock: product.outOfStock,
        options: product.options.map((option) => ({
          id: option.id,
          name: option.name,
          type: (option.type as ProductOption["type"]) || "OTHER",
          price: option.price,
          originalPrice: option.originalPrice,
          description: option.description,
        })),
      })),
    );

    if (!databaseProducts.length) return null;

    const databaseStoreCategories = databaseCategories.map((category) => ({
      slug: category.slug,
      name: category.name,
      description: category.description?.trim() || `${category.name} products`,
      count: category.products.length,
      image: category.image,
      accent: category.accent || "#6C63FF",
    }));

    return {
      products: databaseProducts,
      categories: buildCategorySummariesFromProducts(
        databaseStoreCategories,
        databaseProducts,
      ),
    };
  } catch (error) {
    // A local database may intentionally be offline while the storefront is
    // being developed. Avoid emitting a server console error (which Next.js
    // surfaces as a browser error overlay) and briefly cool down retries.
    const retryAfter = Date.now() + 30_000;
    setCatalogRetryAfter(retryAfter);
    if (
      process.env.NODE_ENV === "development" &&
      shouldWarnAboutCatalogFallback(retryAfter)
    ) {
      const reason = error instanceof Error ? error.message : String(error);

      console.warn(
        `Database catalog is unavailable; using the static product catalog. Reason: ${reason}`,
      );
    }
    return null;
  }
}

export function invalidateStoreCatalogCache() {
  globalForCatalog.cachedCatalog = undefined;
  globalForCatalog.catalogPromise = undefined;
}

export async function getStoreCatalog(): Promise<StoreCatalog> {
  const now = Date.now();
  if (globalForCatalog.cachedCatalog) {
    const isFresh =
      now - globalForCatalog.cachedCatalog.timestamp < CATALOG_CACHE_TTL_MS;
    if (isFresh) {
      return globalForCatalog.cachedCatalog.data;
    }

    // Stale-while-revalidate: immediately return existing catalog data to eliminate latency,
    // and revalidate from database asynchronously in the background.
    if (!globalForCatalog.revalidating) {
      globalForCatalog.revalidating = true;
      loadDatabaseCatalog()
        .then((fresh) => {
          if (fresh) {
            globalForCatalog.cachedCatalog = {
              data: fresh,
              timestamp: Date.now(),
            };
          }
        })
        .catch(() => {})
        .finally(() => {
          globalForCatalog.revalidating = false;
        });
    }

    return globalForCatalog.cachedCatalog.data;
  }

  globalForCatalog.catalogPromise ??= (async () => {
    try {
      const catalog = await loadDatabaseCatalog();
      if (catalog) {
        globalForCatalog.cachedCatalog = {
          data: catalog,
          timestamp: Date.now(),
        };
        return catalog;
      }
      return staticCatalog;
    } finally {
      globalForCatalog.catalogPromise = undefined;
    }
  })();

  return await globalForCatalog.catalogPromise;
}

export async function getStoreCategories(): Promise<StoreCategory[]> {
  return (await getStoreCatalog()).categories;
}

export async function getStoreProducts(): Promise<Product[]> {
  return (await getStoreCatalog()).products;
}

// Background pre-warm on module load to ensure 0ms latency for users
if (typeof window === "undefined" && process.env.DATABASE_URL) {
  setTimeout(() => {
    getStoreCatalog().catch(() => {});
  }, 100);
}
