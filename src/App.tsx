import { z } from 'zod'
import './App.css'
import { useEffect, useState } from 'react';
import { useForm } from "react-hook-form"
function stringToNumber(str: string): number {
  let num = 0;
  for (let i = 0; i < str.length; i++) {
    num = ((num << 5) - num) + str.charCodeAt(i);
    num = num & num;
  }
  return num;
}

// const STUDENTS = [
//   "Aidan",
//   "Alex",
//   "Andrew",
//   "Annie",
//   "Austin",
//   "Braeden",
//   "Brendan",
//   "Caleb",
//   "Cameron",
//   "Carter",
//   "Chase",
//   "Chris",
//   "Christian",
//   "Cole",
//   "Connor",
// ]



// const NUM_GROUPS = 5;

// const MAX_GROUP_SIZE = Math.ceil(STUDENTS.length / NUM_GROUPS);

class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }

  public next(): number {
    this.seed = this.seed * 16807 % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}
const date = (new Date());
// date.setDate(date.getDate() + 7);
const dateString = Intl.DateTimeFormat("en-US", { dateStyle: 'full', }).format(date);
const dateNum = stringToNumber(Intl.DateTimeFormat("en-US", { dateStyle: 'short', }).format(date));


function makeTableGroups(students: string[], numGroups: number, maxGroupSize: number, random: () => number): { groups: string[][], extraStudents: string[] } {
  const groups: string[][] = [];
  const extraStudents: string[] = [];

  // Shuffle the students array
  const shuffledStudents = students.sort(() => 0.5 - random());

  let currentGroupIndex = 0;
  let currentGroupSize = 0;

  for (const student of shuffledStudents) {
      if (currentGroupSize === maxGroupSize) {
          // Move to the next group
          currentGroupIndex++;
          currentGroupSize = 0;

          if (currentGroupIndex >= numGroups) {
              // No more groups available, add remaining students to extraStudents
              extraStudents.push(...shuffledStudents.slice(shuffledStudents.indexOf(student)));
              break;
          }
      }

      if (!groups[currentGroupIndex]) {
          groups[currentGroupIndex] = [];
      }

      groups[currentGroupIndex].push(student);
      currentGroupSize++;
  }

  return { groups, extraStudents };
}


const configSchema = z.object({
  students: z.array(z.string()),
  numGroups: z.number(),
  maxGroupSize: z.number(),
});

type FormData = {
  students: string;
  numGroups: string;
  maxGroupSize: string;
}

function App() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<{ groups: string[][], extraStudents: string[] } | null>(null);
  function hashChange() {
    try {
      const hash = window.location.hash.slice(1);
      const decoded = atob(hash);
      const data = JSON.parse(decoded);
      console.log(data);
      
      const config = configSchema.parse(data);
      const random = new SeededRandom(dateNum);
      const groups = makeTableGroups(config.students, config.numGroups, config.maxGroupSize, () => random.next());
      console.log(groups);
      
      setGroups(groups);
    } catch (e) {
      setGroups(null);
      console.log(e);
      
    }
  }

  useEffect(() => {
    window.addEventListener('hashchange', hashChange);
    hashChange();
    setLoading(false);
    return () => {
      window.removeEventListener('hashchange', hashChange);
    }
  }, [])

  const { register, handleSubmit } = useForm<FormData>();
  const onSubmit = (data: FormData) => {
  
    const config: z.infer<typeof configSchema> = {
      students: data.students.split("\n").map(s => s.trim()).filter(s => s.length > 0),
      numGroups: parseInt(data.numGroups),
      maxGroupSize: parseInt(data.maxGroupSize),
    }
    const hash = btoa(JSON.stringify(config));
    window.location.hash = hash;

  };
  if (!loading) {

    if (groups) {
  
  
      return (
        <>
          {dateString}
          <br />
  
          <br />
          <table>
            <tbody>
              {groups.groups.map((group, i) => (
                <tr key={i}>
                  <td>Group {i + 1}: </td>
                  <td style={{textAlign: "left"}}>{group.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <br />
          <p>
            Extra Students: {groups.extraStudents.join(", ")}
          </p>
        </>
      )
    } else {
  
      
      return (
        <form onSubmit={handleSubmit(onSubmit)}>
          <label>
            Students:
            <textarea {...register("students")} />
          </label>
          <br />
          <label>
            Number of Groups:
            <input type="number" {...register("numGroups")} />
          </label>
          <br />
  
          <label>
            Max Group Size:
            <input type="number" {...register("maxGroupSize")} />
          </label>
          <br />
  
          <button type="submit">Generate</button>
        </form>
      )
    }
  }
}



export default App

