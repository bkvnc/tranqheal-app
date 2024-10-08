import BrandOne from '../../images/brand/brand-01.svg';
import BrandTwo from '../../images/brand/brand-02.svg';
import BrandThree from '../../images/brand/brand-03.svg';
import BrandFour from '../../images/brand/brand-04.svg';
import BrandFive from '../../images/brand/brand-05.svg';

const TopForumsTable = () => {
  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Top Forums
      </h4>
      

      <div className="flex flex-col">
        <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-4">
          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Name
            </h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Members
            </h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Posts
            </h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Growth
            </h5>
          </div>
        </div>

        <div className="grid grid-cols-3 border-b border-stroke dark:border-strokedark sm:grid-cols-4">
          <div className="flex items-center gap-3 p-2.5 xl:p-5">
            {/* <div className="flex-shrink-0">
              <img src={BrandOne} alt="Brand" />
            </div> */}
            <p className="hidden text-black dark:text-white sm:block">RelationshipRealm</p>
          </div>

          <div className="flex items-center justify-center p-2.5 xl:p-5">
            <p className="text-black dark:text-white">3.5K</p>
          </div>


          <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
            <p className="text-black dark:text-white">590</p>
          </div>

          <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
            <p className="text-meta-5">4.8%</p>
          </div>
        </div>

        <div className="grid grid-cols-3 border-b border-stroke dark:border-strokedark sm:grid-cols-4">
          <div className="flex items-center gap-3 p-2.5 xl:p-5">
            {/* <div className="flex-shrink-0">
              <img src={BrandTwo} alt="Brand" />
            </div> */}
            <p className="hidden text-black dark:text-white sm:block">
            StudentMentalWellness
            </p>
          </div>

          <div className="flex items-center justify-center p-2.5 xl:p-5">
            <p className="text-black dark:text-white">2.2K</p>
          </div>


          <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
            <p className="text-black dark:text-white">467</p>
          </div>

          <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
            <p className="text-meta-5">4.3%</p>
          </div>
        </div>

        <div className="grid grid-cols-3 border-b border-stroke dark:border-strokedark sm:grid-cols-4">
          <div className="flex items-center gap-3 p-2.5 xl:p-5">
            {/* <div className="flex-shrink-0">
              <img src={BrandThree} alt="Brand" />
            </div> */}
            <p className="hidden text-black dark:text-white sm:block">TigilBullyingBayan</p>
          </div>

          <div className="flex items-center justify-center p-2.5 xl:p-5">
            <p className="text-black dark:text-white">2.1K</p>
          </div>



          <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
            <p className="text-black dark:text-white">420</p>
          </div>

          <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
            <p className="text-meta-5">3.7%</p>
          </div>
        </div>

        <div className="grid grid-cols-3 border-b border-stroke dark:border-strokedark sm:grid-cols-4">
          <div className="flex items-center gap-3 p-2.5 xl:p-5">
            {/* <div className="flex-shrink-0">
              <img src={BrandFour} alt="Brand" />
            </div> */}
            <p className="hidden text-black dark:text-white sm:block">CareerGuidanceHub</p>
          </div>

          <div className="flex items-center justify-center p-2.5 xl:p-5">
            <p className="text-black dark:text-white">1.5K</p>
          </div>



          <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
            <p className="text-black dark:text-white">389</p>
          </div>

          <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
            <p className="text-meta-5">2.5%</p>
          </div>
        </div>

        <div className="grid grid-cols-3 border-b border-stroke dark:border-strokedark sm:grid-cols-4">
          <div className="flex items-center gap-3 p-2.5 xl:p-5">
            {/* <div className="flex-shrink-0">
              <img src={BrandFour} alt="Brand" />
            </div> */}
            <p className="hidden text-black dark:text-white sm:block">FamilyWellbeingHub</p>
          </div>

          <div className="flex items-center justify-center p-2.5 xl:p-5">
            <p className="text-black dark:text-white">1.5K</p>
          </div>



          <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
            <p className="text-black dark:text-white">389</p>
          </div>

          <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
            <p className="text-meta-5">2.5%</p>
          </div>
        </div>
      </div>
      <div className="flex justify-center mt-4">
        <button className="bg-blue-500 text-black py-2 px-4 rounded mr-2 dark:text-white">Previous</button>
        <button className="bg-blue-500 text-black py-2 px-4 rounded dark:text-white">Next</button>
      </div>
    </div>
  );
};

export default TopForumsTable;
