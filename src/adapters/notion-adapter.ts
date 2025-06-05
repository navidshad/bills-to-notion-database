import { Client } from "@notionhq/client";

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN, // or directly paste your token as a string
});

const databaseId = process.env.DATABASE_ID || "";

// function getDatabaseItems() {
//   return notion.databases
//     .query({
//       database_id: databaseId,
//       filter: { property: "Status", select: { is_not_empty: true } },
//     })
//     .then((response) => {
//       console.log(response.results);
//     });
// }

function flatItems(description: string) {
  // seperate by , and . to new lines
  description = description.split(",").join("\n");
  description = description.split(".").join("\n");

  // trim the lines
  description = description
    .split("\n")
    .map((line: string) => line.trim())
    .join("\n");

  return description;
}

function normalizeDate(date: string) {
  // remove time
  date = date.split(" ")[0];

  // remove `"`, `'` around the date
  date = date.replace(/["']/g, "");

  // replace `/` with `-`
  date = date.split("/").join("-");

  // replace `.` with `-`
  date = date.split(".").join("-");

  return date;
}

async function addItem(
  title: string,
  totalPrice: number,
  currency_code: string,
  date: string,
  description: string
) {
  description = description || "";
  description = flatItems(description);

  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
        $code: {
          rich_text: [
            {
              text: {
                content: currency_code,
              },
            },
          ],
        },
        Price: {
          number: totalPrice,
        },
        Date: {
          date: {
            start: normalizeDate(date),
          },
        },
        Desc: {
          rich_text: [
            {
              text: {
                content: description,
              },
            },
          ],
        },
        // Status: {
        //   select: {
        //     name: "In Trip",
        //   },
        // },
      },
    });
    console.log("Success! Entry added.");
  } catch (error: any) {
    console.error("Error adding item:", error.body);
    throw error;
  }
}

export { addItem };
