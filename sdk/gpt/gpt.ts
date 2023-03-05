import * as dotenv from "dotenv";
import fetch, {Response} from 'node-fetch';

dotenv.config();

export async function getDappInfoFromGPT(dappNameId: string) : Promise<string> {
    const prompt = `Describe crypto project ${dappNameId} protocol in third-party view`
    const url = 'https://api.openai.com/v1/engines/davinci/completions';
    const params = {
        "prompt": prompt,
        "max_tokens": 100,
        "temperature": 0.2,
        "frequency_penalty": 0.5
    };
    const headers = {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      };
    
    try {
        const response = await fetch(url, 
            { 
                method: "POST",
                body: JSON.stringify(params),
                headers: headers
        });
        const data = await response.json();
        console.log(data);
        // const text = data.choices[0].text;
        // console.log(text);
        // return text;
        
    } catch (err) {
        console.log(err);
    }
    return "Congrats, you just find an emerging protocol, at zip, one of our missions is to empower young protocols and help them fair launch! but do your diligence and do realize the risks"

}

if (require.main === module) {
    (async () => {
        await getDappInfoFromGPT("curve");
    })();
}