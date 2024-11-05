API Endpoints
Scholars
GET /api/scholars
Retrieve a list of scholars.
Parameters:

page (optional): Page number for pagination
limit (optional): Number of items per page
search (optional): Search term for filtering scholars

Response:
jsonCopy{
  "scholars": [
    {
      "id": 1,
      "name": "John Doe",
      "institution": "Example University",
      "papers": 45,
      "citations": 1200,
      "hIndex": 15
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}

GET /api/scholars/:id
Retrieve a specific scholar by ID.

GET /api/metrics
Retrieve aggregated metrics.
Response:
jsonCopy{
  "totalScholars": 1078,
  "totalPapers": 15420,
  "totalCitations": 347995,
  "averageHIndex": 15.4
}