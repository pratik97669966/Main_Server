const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fs = require('fs');
const { NewUser } = require('./models/NewUser.js');

const app = express();
const PORT = process.env.PORT || 3030;
const MONGODB_URI_NEW = 'mongodb+srv://sandipshelke203:sandipshelke203@data.l6eak.mongodb.net/?retryWrites=true&w=majority&appName=Data';

app.use(bodyParser.json());

mongoose.connect(MONGODB_URI_NEW, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('New MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const isValidDate = (date) => {
    return !isNaN(Date.parse(date)) && date !== '0000-00-00';
};

const formatDateOfBirth = (dob) => {
    // Ensure the dob string is not empty or null
    if (!dob) return dob;

    const dateParts = dob.split('-');

    // Check if the date has exactly 3 parts: year, month, day
    if (dateParts.length === 3) {
        const [year, month, day] = dateParts;

        // List of month names for mapping
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        // Ensure the month is valid (1-12)
        const monthIndex = parseInt(month, 10) - 1; // Convert month string to zero-based index
        if (monthIndex < 0 || monthIndex > 11) {
            console.error('Invalid month:', month);
            return dob; // Return original input if month is invalid
        }

        // Get the corresponding month name
        const monthName = monthNames[monthIndex];

        // Format the date as dd-MMM-yyyy
        const formattedDate = `${day.padStart(2, '0')}-${monthName}-${year}`;
        return formattedDate;
    }

    return dob;
};


const trimStringFields = (obj) => {
    for (let key in obj) {
        if (typeof obj[key] === 'string') {
            obj[key] = obj[key].trim();
        }
    }
    return obj;
};
const formatDate = (date) => {
    if (!date) return ''; // Return empty if date is not valid

    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
};
const getHeight = (value) => {
    const heightMap = [
        "Does not Matter",
        "4'0", "4'1", "4'2", "4'3", "4'4", "4'5", "4'6", "4'7", "4'8", "4'9",
        "4'10", "4'11", "5'0", "5'1", "5'2", "5'3", "5'4", "5'5", "5'6", "5'7",
        "5'8", "5'9", "5'10", "5'11", "6'0", "6'1", "6'2", "6'3", "6'4", "6'5",
        "6'6", "6'7", "6'8", "6'9", "6'10", "6'11", "7'0"
    ];

    if (value === "Does not Matter") {
        return "Does not Matter";
    }

    const index = parseInt(value, 10); // Parse the input as an integer
    if (!isNaN(index) && index >= 1 && index < heightMap.length) {
        return heightMap[index];
    }

    return "";
};
const removeHtmlTags = (input) => {
    if (!input) return ''; // Return empty if input is falsy
    // Remove HTML tags and replace \r\n, \n, and \r with a space
    return input.replace(/<\/?[^>]+(>|$)/g, "")  // Remove HTML tags
        .replace(/(\r\n|\n|\r)/g, " ")   // Remove newlines
        .replace(/\s+/g, ' ')           // Replace multiple spaces with a single space
        .trim();                        // Remove any leading or trailing spaces
};
function dateToMilliseconds(dateString) {
    return new Date(dateString).getTime();
}
const migrateData = async () => {
    try {
        const rawData = fs.readFileSync('./oldData.json'); // Adjust the path as needed
        const oldUsers = JSON.parse(rawData);
        const newUsersData = {};
        const mobileToUserIdMapping = {};

        for (const oldUser of oldUsers) {
            const fixedTOB = oldUser.TOB ? oldUser.TOB.replace('::', '') : '';

            const activationDate = isValidDate(oldUser.Regdate) ? dateToMilliseconds(oldUser.Regdate) : 0;
            const expiryDate = isValidDate(oldUser.MemshipExpiryDate) ? dateToMilliseconds(oldUser.MemshipExpiryDate) : 0;

            const weightValue = oldUser.Weight ? parseFloat(oldUser.Weight.split(' ')[0]) : 0;

            const newUser = {
                status: "ACTIVE_USER",
                membershipPlan: removeHtmlTags(oldUser.Status || ""),
                numberOfContacts: oldUser.Noofcontacts || 0,
                activationDate: activationDate,
                expiryDate: expiryDate ,
                userId: removeHtmlTags(oldUser.MatriID || ""),
                name: removeHtmlTags(oldUser.Name || ""),
                phone: removeHtmlTags(oldUser.Mobile || ""),
                country: removeHtmlTags(oldUser.Country || ""),
                lastSeen: oldUser.last_seen != "0000-00-00 00:00:00" ? dateToMilliseconds(oldUser.last_seen) : 0,
                state: removeHtmlTags(oldUser.State || ""),
                city: removeHtmlTags(oldUser.City || ""),
                profileCreatedFor: removeHtmlTags(oldUser.Profilecreatedby || ""),
                profilePictureUrls: [
                    oldUser.Photo1 ? `https://kartavyavivahbandhan.com/gallary/${oldUser.Photo1}` : null
                ].filter(Boolean),
                gender: removeHtmlTags(oldUser.Gender || ""),
                religion: removeHtmlTags(oldUser.Religion || ""),
                caste: removeHtmlTags(oldUser.Caste || ""),
                subCaste: removeHtmlTags(oldUser.Subcaste || ""),
                maritalStatus: removeHtmlTags(oldUser.Maritalstatus || ""),
                dateOfBirth: removeHtmlTags(formatDateOfBirth(oldUser.DOB) + "") || "",
                age: removeHtmlTags(oldUser.Age || ""),
                email: removeHtmlTags(oldUser.ConfirmEmail || ""),
                password: removeHtmlTags(oldUser.ConfirmPassword || ""),
                referByName: removeHtmlTags(oldUser.Referenceby || ""),
                aboutMe: removeHtmlTags(oldUser.aboutus || ""),
                education: removeHtmlTags(oldUser.Education || ""),
                educationDetails: removeHtmlTags(oldUser.EducationDetails || ""),
                employedIn: removeHtmlTags(oldUser.Employedin || ""),
                occupation: removeHtmlTags(oldUser.Occupation || ""),
                occupationDetails: removeHtmlTags(oldUser.occu_details || ""),
                annualIncome: removeHtmlTags(oldUser.Annualincome || ""),
                incomeType: removeHtmlTags(oldUser.income_in || ""),
                anyOtherSourceIncome: removeHtmlTags(oldUser.anyotherincome || ""),
                workingHours: removeHtmlTags(oldUser.working_hours || ""),
                workingLocationCity: removeHtmlTags(oldUser.workinglocation || ""),
                workingExperience: removeHtmlTags(oldUser.work_experiance_year || ""),
                workingExperienceDetails: removeHtmlTags(oldUser.Experience_Details || ""),
                lookingFor: removeHtmlTags(oldUser.Looking || ""),
                partnerAgeRange: removeHtmlTags(`${oldUser.PE_FromAge ? `From ${oldUser.PE_FromAge}` : ""} ${oldUser.PE_ToAge ? `To ${oldUser.PE_ToAge}` : ""}`.trim()),
                partnerHeightRange: removeHtmlTags(`${oldUser.PE_from_Height ? `From ${getHeight(oldUser.PE_from_Height)}` : ""} ${oldUser.PE_to_Height ? `To ${getHeight(oldUser.PE_to_Height)}` : ""}`.trim()),
                partnerIncomeRange: removeHtmlTags(`${oldUser.PE_income_from ? `From ${oldUser.PE_income_from}` : ""} ${oldUser.PE_income_to ? `To ${oldUser.PE_income_to}` : ""}`.trim()),
                partnerComplexion: removeHtmlTags(oldUser.PE_Complexion || ""),
                partnerDiet: removeHtmlTags(oldUser.Diet || ""),
                expectedEducation: removeHtmlTags(oldUser.PE_Education || ""),
                partnerOccupation: removeHtmlTags(oldUser.PE_Occupation || ""),
                partnerReligion: removeHtmlTags(oldUser.PE_Religion || ""),
                partnerCaste: removeHtmlTags(oldUser.PE_Caste || ""),
                partnerSubCaste: removeHtmlTags(oldUser.PE_subcaste || ""),
                readyToMarryInSameCaste: removeHtmlTags(oldUser.pe_subcaste_marry || ""),
                partnerCountryLivingIn: removeHtmlTags(oldUser.PE_Countrylivingin || ""),
                partnerState: removeHtmlTags(oldUser.PE_State || ""),
                preferredWorkingCities: removeHtmlTags(oldUser.PartnerExpectations || ""),
                preferredNativeCities: removeHtmlTags(oldUser.PartnerExpectations || ""),
                partnerExpectations: removeHtmlTags(oldUser.PartnerExpectations || ""),
                familyValues: removeHtmlTags(oldUser.Familyvalues || ""),
                familyType: removeHtmlTags(oldUser.FamilyType || ""),
                familyStatus: removeHtmlTags(oldUser.FamilyStatus || ""),
                motherTongue: removeHtmlTags(oldUser.mother_tounge || ""),
                numberOfBrothers: oldUser.noofbrothers || "",
                numberOfSisters: oldUser.noofsisters || "",
                numberOfBrothersMarried: oldUser.nbm || "",
                numberOfSistersMarried: oldUser.nsm || "",
                fatherName: removeHtmlTags(oldUser.Fathername || ""),
                fatherOccupation: removeHtmlTags(oldUser.Fathersoccupation || ""),
                fatherAlive: removeHtmlTags(oldUser.Fatherlivingstatus || ""),
                motherName: removeHtmlTags(oldUser.Mothersname || ""),
                motherOccupation: removeHtmlTags(oldUser.Mothersoccupation || ""),
                motherAlive: removeHtmlTags(oldUser.Motherlivingstatus || ""),
                parentsStay: removeHtmlTags(oldUser.parents_stay || ""),
                nativeCountry: removeHtmlTags(oldUser.Native_X_Country || ""),
                nativeState: removeHtmlTags(oldUser.Native_X_State || ""),
                nativeDistrict: removeHtmlTags(oldUser.Native_X_District || ""),
                nativeCity: removeHtmlTags(oldUser.Native_X_City || ""),
                currentCountry: removeHtmlTags(oldUser.Current_X_Country || ""),
                currentState: removeHtmlTags(oldUser.Current_X_State || ""),
                currentDistrict: removeHtmlTags(oldUser.Current_X_District || ""),
                currentCity: removeHtmlTags(oldUser.Current_X_City || ""),
                mamaName: removeHtmlTags(oldUser.unclename || ""),
                mamaCity: removeHtmlTags(oldUser.unclecity || ""),
                familyWealth: removeHtmlTags(oldUser.family_wealth || ""),
                familyWealthDetails: removeHtmlTags(oldUser.property || ""),
                surnamesOfRelatives: removeHtmlTags(oldUser.relatives || ""),
                aboutFamily: removeHtmlTags(oldUser.Family_extra_box || ""),
                numberOfChildrenGirl: oldUser.Divorce_Child_girl || "",
                numberOfChildrenBoy: oldUser.noyubrothers || "",
                childrenLivingStatus: removeHtmlTags(oldUser.childrenlivingstatus || ""),
                address: removeHtmlTags(oldUser.Address || ""),
                contactCountry: removeHtmlTags(oldUser.Country || ""),
                contactState: removeHtmlTags(oldUser.State || ""),
                contactDistrict: removeHtmlTags(oldUser.Dist || ""),
                contactCity: removeHtmlTags(oldUser.City || ""),
                alternatePhone: removeHtmlTags(oldUser.Mobile2 || ""),
                mobile: removeHtmlTags(oldUser.Mobile || ""),
                whatsappNo: removeHtmlTags(oldUser.Mobile || ""),
                height: removeHtmlTags(getHeight(oldUser.Height) || ""),
                weight: weightValue,
                bloodGroup: removeHtmlTags(oldUser.BloodGroup || ""),
                complexion: removeHtmlTags(oldUser.Complexion || ""),
                bodyType: removeHtmlTags(oldUser.Bodytype || ""),
                diet: removeHtmlTags(oldUser.Diet || ""),
                anyAchievement: removeHtmlTags(oldUser.achievement || ""),
                medicalHistory: removeHtmlTags(oldUser.medicalhistory || ""),
                specialCases: removeHtmlTags(oldUser.spe_cases || ""),
                doYouHavePassport: removeHtmlTags(oldUser.passport || ""),
                cardType: removeHtmlTags(oldUser.cardtype || ""),
                moonsign: removeHtmlTags(oldUser.Moonsign || ""),
                star: removeHtmlTags(oldUser.Star || ""),
                gotra: removeHtmlTags(oldUser.Gothram || ""),
                devak: removeHtmlTags(oldUser.devak || ""),
                manglik: removeHtmlTags(oldUser.Manglik || ""),
                shani: removeHtmlTags(oldUser.shani || ""),
                gan: removeHtmlTags(oldUser.Gan || ""),
                nadi: removeHtmlTags(oldUser.nadi || ""),
                charan: removeHtmlTags(oldUser.charan || ""),
                horoscopeMatch: removeHtmlTags(oldUser.Horosmatch || ""),
                placeOfBirth: removeHtmlTags(oldUser.POB || ""),
                birthCountry: removeHtmlTags(oldUser.POC || ""),
                timeOfBirth: removeHtmlTags(fixedTOB),
                hobbies: removeHtmlTags(oldUser.Hobbies || ""),
                interests: removeHtmlTags(oldUser.Interests || ""),
                isProfileBlur: oldUser.profile_approve === 'No',
                isHoroscopeVisible: oldUser.horoscope_visibility !== 'paidhoro',
                isRequestProfile: oldUser.phone_visibility !== 'paidphone',
            };

            // Trim all string fields
            trimStringFields(newUser);

            const userId = oldUser.MatriID || `user_${Math.random().toString(36).substr(2, 9)}`;
            newUsersData[userId] = newUser;
            mobileToUserIdMapping[newUser.phone] = userId;

            const userRecord = new NewUser(newUser);
            await userRecord.save();
        }

        fs.writeFileSync('./outputfirebaseMOBILE.json', JSON.stringify(mobileToUserIdMapping, null, 2));
        fs.writeFileSync('./outputfirebaseUSER.json', JSON.stringify(newUsersData, null, 2));

        console.log('Migration and JSON generation complete.');
    } catch (err) {
        console.error('Data migration error:', err);
    }
};

migrateData();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
