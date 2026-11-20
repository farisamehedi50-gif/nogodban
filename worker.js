export default {
  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    const headers = {
      "Content-Type": "application/json; charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // CORS preflight (OPTIONS) হ্যান্ডেল
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers,
      });
    }

    // POST অথবা GET থেকে ফোন নম্বর গ্রহণ
    let bodyData = {};
    if (method === "POST") {
      const contentType = request.headers.get("Content-Type") || "";
      try {
        if (contentType.includes("application/json")) {
          bodyData = await request.json();
        } else if (
          contentType.includes("application/x-www-form-urlencoded") ||
          contentType.includes("multipart/form-data")
        ) {
          const formData = await request.formData();
          for (const [key, value] of formData.entries()) {
            bodyData[key] = value;
          }
        } else {
          const rawText = await request.text();
          if (rawText) {
            const params = new URLSearchParams(rawText);
            for (const [key, value] of params.entries()) {
              bodyData[key] = value;
            }
          }
        }
      } catch (e) {
        bodyData = {};
      }
    }

    const rawPhone =
      url.searchParams.get("phone") ??
      url.searchParams.get("number") ??
      bodyData.phone ??
      bodyData.number ??
      "";

    // ফোন নম্বর ক্লিন করা
    const phone = String(rawPhone).replace(/<[^>]*>?/gm, "").trim();

    // নম্বর না দেওয়া হলে
    if (!phone) {
      return new Response(
        JSON.stringify(
          {
            status: "error",
            message: "Phone number is required. Use ?phone=01XXXXXXXXX",
            code: 400,
          },
          null,
          4
        ),
        {
          status: 400,
          headers,
        }
      );
    }

    // ১১ ডিজিটের বাংলাদেশি নম্বর ভ্যালিডেশন (013 - 019)
    if (!/^01[3-9]\d{8}$/.test(phone)) {
      return new Response(
        JSON.stringify(
          {
            status: "error",
            message: "Invalid 11-digit Bangladeshi phone number format.",
            number: phone,
            code: 400,
          },
          null,
          4
        ),
        {
          status: 400,
          headers,
        }
      );
    }

    // র্যান্ডম ট্রানজ্যাকশন আইডি জেনারেট
    const trxId = "NAGAD" + generateRandomHex(8).toUpperCase();

    // সফল JSON রেসপন্স
    const response = {
      status: "Nagad ban Successfully",
      status_code: 200,
      number: phone,
      trx_id: trxId,
      action_type: "Permanent Block",
      timestamp: formatDateTime(new Date()),
      "Api owner": "XrootCodeX",
      Devloper: "MehediSanix",
    };

    return new Response(JSON.stringify(response, null, 4), {
      status: 200,
      headers,
    });
  },
};

function generateRandomHex(length) {
  const bytes = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}
