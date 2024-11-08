// src/app/people/[id]/page.tsx
export default function PersonDetailPage({ params }: { params: { id: string } }) {
    // In a real app, you would fetch the person's data using the ID
    // This is just an example
    const person = {
      id: params.id,
      name: 'John Doe',
      department: 'Computer Science',
      email: 'john.doe@university.edu',
      research: 'Artificial Intelligence',
      publications: [
        'Publication 1',
        'Publication 2'
      ]
    }
  
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">{person.name}</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold">Department</h2>
            <p>{person.department}</p>
          </div>
  
          <div>
            <h2 className="font-semibold">Email</h2>
            <p>{person.email}</p>
          </div>
  
          <div>
            <h2 className="font-semibold">Research Area</h2>
            <p>{person.research}</p>
          </div>
  
          <div>
            <h2 className="font-semibold">Publications</h2>
            <ul className="list-disc pl-5">
              {person.publications.map((pub, index) => (
                <li key={index}>{pub}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }