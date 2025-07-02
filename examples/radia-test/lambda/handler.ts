export const handler = async (event: any = {}): Promise<any> => {
    console.log("Hello from Lambda!");
    return { status: "success", event };
  };