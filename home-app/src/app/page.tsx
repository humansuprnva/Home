import Calendar from "@/components/Calendar";
import BulletinBoard from "@/components/BulletinBoard";
import Lists from "@/components/Lists";
import LogsMeals from "@/components/LogsMeals";
import Documents from "@/components/Documents";

export default function Home() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="col-span-1 lg:col-span-2">
        <Calendar />
      </div>
      <div className="col-span-1">
        <BulletinBoard />
      </div>
      <div className="col-span-1">
        <Lists />
      </div>
      <div className="col-span-1 lg:col-span-2">
        <LogsMeals />
      </div>
      <div className="col-span-1 md:col-span-2 lg:col-span-3">
        <Documents />
      </div>
    </div>
  );
}
