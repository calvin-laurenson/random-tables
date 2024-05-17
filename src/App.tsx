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


function makeTableGroups(students: string[], numGroups: number, maxGroupSize: number, random: SeededRandom): string[][] {
  const shuffled = [...students];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const groups: string[][] | null = new Array(numGroups).fill(null).map(() => []);
  for (let i = 0; i < shuffled.length; i++) {
    const groupIndex = i % numGroups;
    groups[groupIndex].push(shuffled[i]);
  }
  for (let i = 0; i < groups.length; i++) {
    while (groups[i].length < maxGroupSize && groups.some(g => g.length > maxGroupSize)) {
      const groupIndex = random.next() * numGroups | 0;
      if (groups[groupIndex].length > maxGroupSize) {
        const studentIndex = random.next() * groups[groupIndex].length | 0;
        groups[i].push(groups[groupIndex].splice(studentIndex, 1)[0]);
      }
    }
  }
  return groups;
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
  const [hashData, setHashData] = useState<z.infer<typeof configSchema> | null>(null);
  const [groups, setGroups] = useState<string[][] | null>(null);
  function hashChange() {
    try {
      const hash = window.location.hash.slice(1);
      const decoded = atob(hash);
      const data = JSON.parse(decoded);
      console.log(data);
      
      const config = configSchema.parse(data);
      setHashData(config);
      const random = new SeededRandom(dateNum);
      const groups = makeTableGroups(config.students, config.numGroups, config.maxGroupSize, random);
      setGroups(groups);
    } catch (e) {
      setHashData(null);
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
              {groups.map((group, i) => (
                <tr key={i}>
                  <td>Group {i + 1}: </td>
                  <td style={{textAlign: "left"}}>{group.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

