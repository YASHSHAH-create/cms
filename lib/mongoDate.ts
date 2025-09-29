// Returns a pipeline stage array that adds `eventDate` from whichever field exists.
// Priority: createdAt | created_at | createdDate | timestamp | _id's timestamp
export function addEventDateStage(fieldCandidates: string[] = [
  "createdAt","created_at","createdDate","timestamp"
]) {
  // Coalesce candidate fields (if exist), else fallback to ObjectId timestamp
  // eventDate will always be a Date.
  return [
    {
      $addFields: {
        __fallbackIdDate: { $toDate: "$_id" },
      },
    },
    {
      $addFields: {
        eventDate: {
          $ifNull: [
            {
              $let: {
                vars: {
                  v1: { $ifNull: [`$${fieldCandidates[0]}`, null] },
                  v2: { $ifNull: [`$${fieldCandidates[1]}`, null] },
                  v3: { $ifNull: [`$${fieldCandidates[2]}`, null] },
                  v4: { $ifNull: [`$${fieldCandidates[3]}`, null] },
                },
                in: {
                  $ifNull: [
                    { $toDate: "$$v1" },
                    { $ifNull: [
                      { $toDate: "$$v2" },
                      { $ifNull: [
                        { $toDate: "$$v3" },
                        { $toDate: "$$v4" },
                      ] }
                    ] }
                  ]
                }
              }
            },
            "$__fallbackIdDate"
          ]
        }
      }
    },
    { $unset: "__fallbackIdDate" }
  ];
}
